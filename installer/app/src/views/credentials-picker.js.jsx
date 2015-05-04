import PrettySelect from './pretty-select';

var AWSCredentialsPicker = React.createClass({
	getDefaultProps: function () {
		return {
			inputCSS: {
				width: 280
			}
		};
	},

	render: function () {
		return (
			<div>
				<div>Credentials: </div>
				<PrettySelect onChange={this.__handleChange} value={this.props.value}>
					{this.props.children}
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
