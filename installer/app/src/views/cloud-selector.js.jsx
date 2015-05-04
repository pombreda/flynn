import AssetPaths from './asset-paths';
import AWSLauncher from './aws-launcher';
import PrettyRadio from './pretty-radio';
import Sheet from './css/sheet';

var cloudNames = {
	aws: 'AWS',
	digital_ocean: 'DigitalOcean'
};

var CloudSelector = React.createClass({
	getInitialState: function () {
		var styleEl = Sheet.createElement({
			display: 'flex',
			textAlign: 'center',
			marginBottom: '1rem',
			selectors: [
				['img', {
					height: '100px'
				}]
			]
		});
		return {
			styleEl: styleEl
		};
	},

	render: function () {
		var state = this.props.state;
		return (
			<div>
				<div id={this.state.styleEl.id}>
					{['aws', 'digital_ocean'].map(function (cloud) {
						return (
							<PrettyRadio key={cloud} name='cloud' value={cloud} checked={state.selectedCloud === cloud} onChange={this.__handleCloudChange}>
								<img src={AssetPaths[cloud.replace('_', '')+'-logo.jpg']} alt={cloudNames[cloud]} />
							</PrettyRadio>
						);
					}.bind(this))}
				</div>
				{state.selectedCloud === 'aws' ? (
					<AWSLauncher state={state} credentials={this.props.credentials.filter(function (creds) {
						return creds.type === 'aws';
					})} />
				) : null}
			</div>
		);
	},

	componentDidMount: function () {
		this.state.styleEl.commit();
	},

	__handleCloudChange: function (e) {
		var cloud = e.target.value;
		this.props.onChange(cloud);
	}
});
export default CloudSelector;
