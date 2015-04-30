import Modal from '../modal';
import Dispatcher from '../../dispatcher';
import PrettySelect from '../pretty-select';
import Sheet from '../css/sheet';
import Colors from '../css/colors';
import { green as GreenBtnCSS, disabled as DisabledBtnCSS } from '../css/button';

var Credentials = React.createClass({
	getDefaultProps: function () {
		var formStyleEl = Sheet.createElement({
			marginTop: '0.5rem',
			selectors: [
				['[data-alert-error]', {
					backgroundColor: Colors.redColor,
					color: Colors.whiteColor,
					padding: '0.25em 0.5em'
				}],

				['input[type=text]', {
					padding: '0.25em 0.5em',
					width: '100%'
				}],

				['* + *', {
					marginTop: '0.5rem'
				}],

				['button', GreenBtnCSS],

				['button:disabled', DisabledBtnCSS]
			]
		});
		return {
			formStyleEl: formStyleEl
		};
	},

	render: function () {
		return (
			<Modal visible={true} onHide={this.__handleHide}>
				<h2>Credentials</h2>

				<PrettySelect onChange={this.__handleProviderChange} value={this.props.provider}>
					<option value="aws">AWS</option>
					<option value="digital_ocean">Digital Ocean</option>
				</PrettySelect>

				<form onSubmit={this.__handleSubmit} id={this.props.formStyleEl.id}>
					{false ? (
						<div data-alert-error>
							TODO: Show error message
						</div>
					) : null}

					<input ref="name" type="text" placeholder="Nickname" />

					{this.props.provider === 'aws' ? (
						<div>
							<input ref="key_id" type="text" placeholder="AWS_ACCESS_KEY_ID" />
							<input ref="key" type="text" placeholder="AWS_ACCESS_KEY_ID" />
						</div>
					) : null}

					{this.props.provider === 'digital_ocean' ? (
						<div>
							<input ref="key" type="text" placeholder="Personal Access Token" />
						</div>
					) : null}

					<button type="submit">Save</button>
				</form>
			</Modal>
		);
	},

	componentDidMount: function () {
		this.props.formStyleEl.commit();
		this.props.dataStore.addChangeListener(this.__handleDataChange);
	},

	componentWillUnmount: function () {
		this.props.dataStore.removeChangeListener(this.__handleDataChange);
	},

	getInitialState: function () {
		return this.__getState();
	},

	__getState: function () {
		return this.props.dataStore.state;
	},

	__handleDataChange: function () {
		this.setState(this.__getState());
	},

	__handleSubmit: function (e) {
		e.preventDefault();
		Dispatcher.dispatch({
			name: 'CREATE_CREDENTIAL',
			data: {
				name: this.refs.name.getDOMNode().value.trim(),
				key_id: this.refs.key_id.getDOMNode().value.trim(),
				key: this.refs.key.getDOMNode().value.trim()
			}
		});
	},

	__handleProviderChange: function (e) {
		var provider = e.target.value;
		Dispatcher.dispatch({
			name: 'NAVIGATE',
			path: '/credentials',
			options: {
				params: [{ provider: provider }]
			}
		});
	},

	__handleHide: function () {
		Dispatcher.dispatch({
			name: 'NAVIGATE',
			path: '/'
		});
	}
});
export default Credentials;
