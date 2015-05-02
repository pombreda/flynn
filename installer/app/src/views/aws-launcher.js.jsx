import Config from '../config';
import { green as GreenBtnCSS, default as BtnCSS, disabled as BtnDisabledCSS } from './css/button';
import AWSCredentialsPicker from './aws-credentials-picker';
import AWSRegionPicker from './aws-region-picker';
import AWSInstanceTypePicker from './aws-instance-type-picker';
import AWSAdvancedOptions from './aws-advanced-options';
import IntegerPicker from './integer-picker';
import Dispatcher from '../dispatcher';
import RouteLink from './route-link';
import { extend } from 'marbles/utils';

var InstallConfig = React.createClass({
	render: function () {
		return (
			<form onSubmit={this.__handleSubmit}>
				{this.props.credentials.length > 0 || Config.has_aws_env_credentials ? (
					<AWSCredentialsPicker
						credentials={this.props.credentials}
						value={this.state.credentialID}
						onChange={this.__handleCredentialsChange} />
				) : (
					<RouteLink path="/credentials?provider=aws" style={BtnCSS}>Add credential to continue</RouteLink>
				)}
				{this.state.credentialID ? (
					<div>
						<br />
						<br />
						<AWSRegionPicker
							value={this.state.region}
							onChange={this.__handleRegionChange} />
						<br />
						<br />
						<AWSInstanceTypePicker
							value={this.state.instanceType}
							onChange={this.__handleInstanceTypeChange} />
						<br />
						<br />
						<label>
							<div>Number of instances: </div>
							<div style={{
								width: 60
								}}>
								<IntegerPicker
									minValue={1}
									maxValue={5}
									skipValues={[2]}
									value={this.state.numInstances}
									onChange={this.__handleNumInstancesChange} />
							</div>
						</label>
						<br />
						<br />
						<AWSAdvancedOptions onChange={this.__handleAdvancedOptionsChange}/>
						<br />
						<br />
						<button
							type="submit"
							style={extend({}, GreenBtnCSS,
								this.state.launchBtnDisabled ? BtnDisabledCSS : {})}
							disabled={this.state.launchBtnDisabled}>Launch</button>
					</div>
				) : null}
			</form>
		);
	},

	getInitialState: function () {
		return this.__getState();
	},

	componentWillReceiveProps: function () {
		this.setState(this.__getState());
	},

	__getState: function () {
		var state = this.props.state;
		var firstCredID = null;
		if (this.props.credentials.length > 0) {
			firstCredID = this.props.credentials[0].id;
		}
		return {
			credentialID: this.__credentialID || (Config.has_aws_env_credentials ? 'aws_env' : firstCredID),
			region: 'us-east-1',
			instanceType: 'm3.medium',
			numInstances: 1,
			advancedOptionsKeys: [],
			launchBtnDisabled: state.currentStep !== 'configure',
		};
	},

	__handleCredentialsChange: function (credentialID) {
		this.__credentialID = credentialID;
		this.setState({
			credentialID: credentialID
		});
	},

	__handleRegionChange: function (region) {
		this.setState({
			region: region
		});
	},

	__handleInstanceTypeChange: function (instanceType) {
		this.setState({
			instanceType: instanceType
		});
	},

	__handleNumInstancesChange: function (numInstances) {
		this.setState({
			numInstances: numInstances
		});
	},

	__handleAdvancedOptionsChange: function (values) {
		this.setState(extend({}, values, {
			advancedOptionsKeys: Object.keys(values)
		}));
	},

	__handleSubmit: function (e) {
		e.preventDefault();
		this.setState({
			launchBtnDisabled: true
		});
		var advancedOptions = {};
		this.state.advancedOptionsKeys.forEach(function (key) {
			advancedOptions[key] = this.state[key];
		}.bind(this));
		Dispatcher.dispatch(extend({
			name: 'LAUNCH_AWS',
			credentialID: this.state.credentialID,
			region: this.state.region,
			instanceType: this.state.instanceType,
			numInstances: this.state.numInstances
		}, advancedOptions));
	}
});
export default InstallConfig;
