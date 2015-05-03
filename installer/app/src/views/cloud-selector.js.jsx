import AssetPaths from './asset-paths';
import AWSLauncher from './aws-launcher';
import PrettyRadio from './pretty-radio';

var CloudSelector = React.createClass({
	render: function () {
		var state = this.props.state;
		return (
			<div>
				<PrettyRadio name='cloud' checked={state.selectedProvider === 'aws'} style={{ textAlign: 'center' }}>
					<img src={AssetPaths['aws-logo.jpg']} />
				</PrettyRadio>
				<br />
				<PrettyRadio name='cloud' checked={state.selectedProvider === 'digital_ocean'} style={{ textAlign: 'center' }}>
					<img src={AssetPaths['digitalocean-logo.jpg']} />
				</PrettyRadio>
				<br />
				{state.selectedProvider === 'aws' ? (
					<AWSLauncher state={state} credentials={this.props.credentials.filter(function (creds) {
						return creds.type === 'aws';
					})} />
				) : null}
			</div>
		);
	}
});
export default CloudSelector;
