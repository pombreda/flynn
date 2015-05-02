import Config from '../config';
import PrettySelect from './pretty-select';

var AWSCredentialsPicker = React.createClass({
	getDefaultProps: function () {
		return {
			inputCSS: {
				width: 280
			}
		};
	},

	getInitialState: function () {
		return {
			showInputs: !Config.has_aws_env_credentials
		};
	},

	render: function () {
		return (
			<div>
				<div>AWS Credentials: </div>
				<PrettySelect onChange={this.__handleChange} value={this.props.value}>
					{Config.has_aws_env_credentials ? (
						<option value="aws_env">Use AWS Env vars</option>
					) : null}
					{this.props.credentials.map(function (creds) {
						return (
							<option key={creds.id} value={creds.id}>{creds.name} ({creds.id})</option>
						);
					})}
				</PrettySelect>
			</div>
		);
	},

	__handleChange: function (e) {
		this.props.onChange(e.target.value);
	}
});
export default AWSCredentialsPicker;
