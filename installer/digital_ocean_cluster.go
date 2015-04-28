package installer

func (c *DigitalOceanCluster) Type() string {
	const t = "digital_ocean"
	return t
}

func (c *DigitalOceanCluster) Base() *BaseCluster {
	return c.base
}

func (c *DigitalOceanCluster) SetDefaultsAndValidate() error {
	c.ClusterID = c.base.ID
	return nil
}

func (c *DigitalOceanCluster) Run() {
}

func (c *DigitalOceanCluster) Delete() {
}
