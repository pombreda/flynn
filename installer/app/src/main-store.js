import { createClass } from 'marbles/utils';
import State from 'marbles/state';
import Client from './client';
import Cluster from './cluster';

var newCluster = new Cluster({id: 'new'});

export default createClass({
	mixins: [State],

	registerWithDispatcher: function (dispatcher) {
		this.dispatcherIndex = dispatcher.register(this.handleEvent.bind(this));
	},

	willInitialize: function () {
		this.__handleClusterChanged = this.__handleClusterChanged.bind(this);
		this.state = this.getInitialState();
		this.__changeListeners = [];
	},

	getInitialState: function () {
		return {
			clusters: [],
			credentials: [],
			currentClusterID: null,
			currentCluster: newCluster
		};
	},

	handleEvent: function (event) {
		var cluster;
		switch (event.name) {
			case 'LAUNCH_AWS':
				this.launchAWS(event);
			break;

			case 'NEW_CLUSTER':
				this.__addCluster(event.cluster);
			break;

			case 'NEW_CREDENTIAL':
				this.__addCredential(event.credential);
			break;

			case 'CREDENTIAL_DELETED':
				this.__removeCredential(event.id);
			break;

			case 'CURRENT_CLUSTER':
				this.setState({
					currentClusterID: event.clusterID,
					currentCluster: event.clusterID === null ? newCluster : this.__findCluster(event.clusterID)
				});
			break;

			case 'CREATE_CREDENTIAL':
				if (this.__findCredentialIndex(event.data.id) !== -1) {
					return;
				}
				this.__addCredential(event.data);
				Client.createCredential(event.data).catch(function (args) {
					var xhr = args[1];
					if (xhr.status === 409) {
						return; // Already exists
					}
					this.__removeCredential(event.data.id);
					// TODO(jvatic): add error for ui to display
					console.log(args[0]);
				}.bind(this));
			break;

			case 'DELETE_CREDENTIAL':
				this.__removeCredential(event.creds.id);
				Client.deleteCredential(event.creds.type, event.creds.id).catch(function (args) {
					var xhr = args[1];
					if (xhr.status === 409) {
						// in use
						this.__addCredential(event.creds);
					}
					// TODO(jvatic): add error for ui to display
					console.log(args[0]);
				}.bind(this));
			break;

			case 'CONFIRM_CLUSTER_DELETE':
				Client.deleteCluster(event.clusterID);
			break;

			case 'LAUNCH_CLUSTER_FAILURE':
				window.console.error(event);
			break;

			case 'INSTALL_PROMPT_RESPONSE':
				Client.sendPromptResponse(event.clusterID, event.promptID, event.data);
			break;

			case 'CHECK_CERT':
				cluster = this.__findCluster(event.clusterID);
				if (cluster) {
					Client.checkCert(event.domainName).then(function () {
						cluster.handleEvent({
							name: 'CERT_VERIFIED'
						});
					}.bind(this));
				}
			break;

			default:
				if (event.name === "CLUSTER_STATE" && event.state === "deleted") {
					this.__removeCluster(event.clusterID);
				}

				cluster = this.__findCluster(event.clusterID);
				if (cluster) {
					cluster.handleEvent(event);
				}
			break;
		}
	},

	launchAWS: function (inputs) {
		var cluster = new Cluster({});
		cluster.type = 'aws';
		cluster.creds = {
			id: inputs.creds.access_key_id || 'aws_env',
			secret: inputs.creds.secret_access_key
		};
		cluster.region = inputs.region;
		cluster.instanceType = inputs.instanceType;
		cluster.numInstances = inputs.numInstances;

		if (inputs.vpcCidr) {
			cluster.vpcCidr = inputs.vpcCidr;
		}

		if (inputs.subnetCidr) {
			cluster.subnetCidr = inputs.subnetCidr;
		}

		Client.launchCluster(cluster.toJSON());
	},

	__addCredential: function (data) {
		var index = this.__findCredentialIndex(data.id);
		if (index !== -1) {
			return;
		}
		var creds = [data].concat(this.state.credentials);
		this.setState({
			credentials: creds
		});
	},

	__removeCredential: function (credentialID) {
		var creds = this.state.credentials;
		var index = this.__findCredentialIndex(credentialID);
		if (index === -1) {
			return;
		}
		creds = creds.slice(0, index).concat(creds.slice(index+1));
		this.setState({
			credentials: creds
		});
	},

	__findCredentialIndex: function (credentialID) {
		var creds = this.state.credentials;
		for (var i = 0, len = creds.length; i < len; i++) {
			if (creds[i].id === credentialID) {
				return i;
			}
		}
		return -1;
	},

	__addCluster: function (cluster) {
		var index = this.__findClusterIndex(cluster.ID);
		if (index !== -1) {
			console.warn('cluster '+ cluster.ID +' already added!');
			return;
		}
		var clusters = [cluster].concat(this.state.clusters);
		var newState = {
			clusters: clusters
		};
		if (cluster.ID === this.state.currentClusterID) {
			newState.currentCluster = cluster;
		}
		this.setState(newState);
		cluster.addChangeListener(this.__handleClusterChanged);
	},

	__findClusterIndex: function (clusterID) {
		var clusters = this.state.clusters;
		for (var i = 0, len = clusters.length; i < len; i++) {
			if (clusters[i].ID === clusterID) {
				return i;
			}
		}
		return -1;
	},

	__findCluster: function (clusterID) {
		var index = this.__findClusterIndex(clusterID);
		if (index === -1) {
			return null;
		} else {
			return this.state.clusters[index];
		}
	},

	__removeCluster: function (clusterID) {
		var index = this.__findClusterIndex(clusterID);
		if (index === -1) {
			return;
		}
		var clusters = this.state.clusters;
		var cluster = clusters[index];
		clusters = clusters.slice(0, index).concat(clusters.slice(index+1));
		cluster.removeChangeListener(this.__handleClusterChanged);
		this.setState({
			clusters: clusters
		});
	},

	__handleClusterChanged: function () {
		// TODO: handle rapid fire change in chunks
		this.setState({
			clusters: this.state.clusters
		});
	}
});
