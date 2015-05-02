package installer

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/flynn/flynn/Godeps/_workspace/src/github.com/cznic/ql"
	log "github.com/flynn/flynn/Godeps/_workspace/src/gopkg.in/inconshreveable/log15.v2"
)

var ClusterNotFoundError = errors.New("Cluster not found")

type Installer struct {
	db            *sql.DB
	events        []*Event
	subscriptions []*Subscription
	clusters      []Cluster
	logger        log.Logger

	dbMtx        sync.RWMutex
	eventsMtx    sync.Mutex
	subscribeMtx sync.Mutex
	clustersMtx  sync.RWMutex
}

func NewInstaller(l log.Logger) *Installer {
	installer := &Installer{
		events:        make([]*Event, 0),
		subscriptions: make([]*Subscription, 0),
		clusters:      make([]Cluster, 0),
		logger:        l,
	}
	if err := installer.openDB(); err != nil {
		panic(err)
	}
	return installer
}

func (i *Installer) txExec(query string, args ...interface{}) error {
	tx, err := i.db.Begin()
	if err != nil {
		return err
	}
	_, err = tx.Exec(query, args...)
	if err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

var credentialExistsError = errors.New("Credential already exists")

func (i *Installer) SaveCredentials(creds *Credential) error {
	i.dbMtx.Lock()
	defer i.dbMtx.Unlock()
	if _, err := i.FindCredentials(creds.ID); err == nil {
		return credentialExistsError
	}
	return i.txExec(`
		INSERT INTO credentials (ID, Secret, Name, Type) VALUES ($1, $2, $3, $4);
  `, creds.ID, creds.Secret, creds.Name, creds.Type)
}

func (i *Installer) FindCredentials(id string) (*Credential, error) {
	creds := &Credential{}
	if err := i.db.QueryRow(`SELECT ID, Secret, Name, Type FROM credentials WHERE ID == $1 LIMIT 1`, id).Scan(&creds.ID, &creds.Secret, &creds.Name, &creds.Type); err != nil {
		return nil, err
	}
	return creds, nil
}

func (i *Installer) LaunchCluster(c Cluster) error {
	if err := c.SetDefaultsAndValidate(); err != nil {
		return err
	}

	if err := i.saveCluster(c); err != nil {
		return err
	}

	base := c.Base()

	i.clustersMtx.Lock()
	i.clusters = append(i.clusters, c)
	i.clustersMtx.Unlock()
	i.SendEvent(&Event{
		Type:      "new_cluster",
		Cluster:   base,
		ClusterID: base.ID,
	})
	c.Run()
	return nil
}

func (i *Installer) saveCluster(c Cluster) error {
	i.dbMtx.Lock()
	defer i.dbMtx.Unlock()

	base := c.Base()

	base.Type = c.Type()
	base.Name = base.ID

	baseFields, err := ql.Marshal(base)
	if err != nil {
		return err
	}
	baseVStr := make([]string, 0, len(baseFields))
	for idx := range baseFields {
		baseVStr = append(baseVStr, fmt.Sprintf("$%d", idx+1))
	}

	clusterFields, err := ql.Marshal(c)
	if err != nil {
		return err
	}
	clusterVStr := make([]string, 0, len(clusterFields))
	for idx := range clusterFields {
		clusterVStr = append(clusterVStr, fmt.Sprintf("$%d", idx+1))
	}

	if err != nil {
		return err
	}
	tx, err := i.db.Begin()
	if err != nil {
		return err
	}
	if _, err := tx.Exec(fmt.Sprintf("INSERT INTO clusters VALUES (%s)", strings.Join(baseVStr, ",")), baseFields...); err != nil {
		tx.Rollback()
		return err
	}
	if _, err := tx.Exec(fmt.Sprintf("INSERT INTO %s_clusters VALUES (%s)", c.Type(), strings.Join(clusterVStr, ",")), clusterFields...); err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func (i *Installer) FindBaseCluster(id string) (*BaseCluster, error) {
	i.clustersMtx.RLock()
	for _, c := range i.clusters {
		base := c.Base()
		if base.ID == id {
			i.clustersMtx.RUnlock()
			return base, nil
		}
	}
	i.clustersMtx.RUnlock()

	c := &BaseCluster{ID: id, installer: i}

	err := i.db.QueryRow(`
	SELECT CredentialID, Type, State, NumInstances, ControllerKey, ControllerPin, DashboardLoginToken, CACert, SSHKeyName, VpcCIDR, SubnetCIDR, DiscoveryToken, DNSZoneID FROM clusters WHERE ID == $1 AND DeletedAt IS NULL LIMIT 1
  `, c.ID).Scan(&c.CredentialID, &c.Type, &c.State, &c.NumInstances, &c.ControllerKey, &c.ControllerPin, &c.DashboardLoginToken, &c.CACert, &c.SSHKeyName, &c.VpcCIDR, &c.SubnetCIDR, &c.DiscoveryToken, &c.DNSZoneID)
	if err != nil {
		return nil, err
	}

	domain := &Domain{ClusterID: c.ID}
	err = i.db.QueryRow(`
  SELECT Name, Token FROM domains WHERE ClusterID == $1 AND DeletedAt IS NULL LIMIT 1
  `, c.ID).Scan(&domain.Name, &domain.Token)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	if err == nil {
		c.Domain = domain
	}

	var instanceIPs []string
	rows, err := i.db.Query(`SELECT IP FROM instances WHERE ClusterID == $1 AND DeletedAt IS NULL`, c.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var ip string
		err = rows.Scan(&ip)
		if err != nil {
			return nil, err
		}
	}
	c.InstanceIPs = instanceIPs

	credential, err := c.FindCredentials()
	if err != nil {
		return nil, err
	}
	c.credential = credential

	return c, nil
}

func (i *Installer) FindCluster(id string) (Cluster, error) {
	i.clustersMtx.RLock()
	for _, c := range i.clusters {
		if c.Base().ID == id {
			i.clustersMtx.RUnlock()
			return c, nil
		}
	}
	i.clustersMtx.RUnlock()

	base := &BaseCluster{}
	if err := i.db.QueryRow(`SELECT Type FROM clusters WHERE ID == $1`, id).Scan(&base.Type); err != nil {
		return nil, err
	}

	switch base.Type {
	case "aws":
		return i.FindAWSCluster(id)
	case "digital_ocean":
		return i.FindDigitalOceanCluster(id)
	default:
		return nil, fmt.Errorf("Invalid cluster type: %s", base.Type)
	}
}

func (i *Installer) FindDigitalOceanCluster(id string) (*DigitalOceanCluster, error) {
	return nil, errors.New("Not implemented")
}

func (i *Installer) FindAWSCluster(id string) (*AWSCluster, error) {
	i.clustersMtx.RLock()
	for _, c := range i.clusters {
		if cluster, ok := c.(*AWSCluster); ok {
			if cluster.ClusterID == id {
				i.clustersMtx.RUnlock()
				return cluster, nil
			}
		}
	}
	i.clustersMtx.RUnlock()

	cluster, err := i.FindBaseCluster(id)
	if err != nil {
		return nil, err
	}

	awsCluster := &AWSCluster{
		base: cluster,
	}

	err = i.db.QueryRow(`
	SELECT StackID, StackName, ImageID, Region, InstanceType, VpcCIDR, SubnetCIDR, DNSZoneID FROM aws_clusters WHERE ClusterID == $1 AND DeletedAt IS NULL LIMIT 1
  `, cluster.ID).Scan(&awsCluster.StackID, &awsCluster.StackName, &awsCluster.ImageID, &awsCluster.Region, &awsCluster.InstanceType, &awsCluster.VpcCIDR, &awsCluster.SubnetCIDR, &awsCluster.DNSZoneID)
	if err != nil {
		return nil, err
	}

	awsCreds, err := awsCluster.FindCredentials()
	if err != nil {
		return nil, err
	}
	awsCluster.creds = awsCreds

	return awsCluster, nil
}

func (i *Installer) DeleteCluster(id string) error {
	awsCluster, err := i.FindAWSCluster(id)
	if err != nil {
		return err
	}
	go awsCluster.Delete()
	return nil
}

func (i *Installer) ClusterDeleted(id string) {
	i.clustersMtx.Lock()
	defer i.clustersMtx.Unlock()
	clusters := make([]Cluster, 0, len(i.clusters))
	for _, c := range i.clusters {
		if c.Base().ID != id {
			clusters = append(clusters, c)
		}
	}
	i.clusters = clusters
}
