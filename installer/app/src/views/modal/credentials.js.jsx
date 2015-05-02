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
		var listStyleEl = Sheet.createElement({
			listStyle: 'none',
			padding: 0,
			selectors: [
				['> li', {
					padding: '0.25em 0.5em'
				}],
				['> li:nth-of-type(2n)', {
					backgroundColor: Colors.grayBlueColor
				}],
				['> li a', {
					color: 'inherit',
					textDecoration: 'none'
				}],
			]
		});
		return {
			formStyleEl: formStyleEl,
			listStyleEl: listStyleEl
		};
	},

	render: function () {
		var provider = this.props.provider;
		return (
			<Modal visible={true} onHide={this.__handleHide}>
				<h2>Credentials</h2>

				<PrettySelect onChange={this.__handleProviderChange} value={provider}>
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

					{provider === 'aws' ? (
						<div>
							<input ref="key_id" type="text" placeholder="AWS_ACCESS_KEY_ID" />
							<input ref="key" type="text" placeholder="AWS_ACCESS_KEY_ID" />
						</div>
					) : null}

					{provider === 'digital_ocean' ? (
						<div>
							<input ref="key" type="text" placeholder="Personal Access Token" />
						</div>
					) : null}

					<button type="submit">Save</button>
				</form>

				<ul id={this.props.listStyleEl.id}>
					{this.state.credentials.filter(function (creds) {
						return creds.type === provider;
					}).map(function (creds) {
						return (
							<li key={creds.id}>
								{provider === 'digital_ocean' ? (
									<span>{creds.name}</span>
								) : (
									<span>{creds.name} ({creds.id})</span>
								)}&nbsp;
								<a href="#delete" onClick={function (e) {
									e.preventDefault();
									var msg = 'Delete credential "'+ creds.name +'"';
									if (provider !== 'digital_ocean') {
										msg += ' ('+ creds.id +')';
									}
									msg += '?';
									if ( !window.confirm(msg) ) {
										return;
									}
									Dispatcher.dispatch({
										name: "DELETE_CREDENTIAL",
										creds: creds
									});
								}}>
									<span className="fa fa-trash" title="Delete" />
								</a>
							</li>
						);
					})}
				</ul>
			</Modal>
		);
	},

	componentDidMount: function () {
		this.props.formStyleEl.commit();
		this.props.listStyleEl.commit();
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
		var id;
		if (this.props.provider === 'digital_ocean') {
			id = 'access-token-'+ Date.now();
		} else {
			id = this.refs.key_id.getDOMNode().value.trim();
			if (id === '') {
				this.refs.key_id.getDOMNode().focus();
				return;
			}
		}
		var name = this.refs.name.getDOMNode().value.trim();
		if (name === '') {
			this.refs.name.getDOMNode().focus();
			return;
		}
		var secret = this.refs.key.getDOMNode().value.trim();
		if (secret === '') {
			this.refs.key.getDOMNode().focus();
			return;
		}
		Dispatcher.dispatch({
			name: 'CREATE_CREDENTIAL',
			data: {
				name: name,
				id: id,
				secret: secret,
				type: this.props.provider
			}
		});
		this.refs.name.getDOMNode().value = '';
		if (this.props.provider !== 'digital_ocean') {
			this.refs.key_id.getDOMNode().value = '';
		}
		this.refs.key.getDOMNode().value = '';
		this.refs.name.getDOMNode().focus();
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
