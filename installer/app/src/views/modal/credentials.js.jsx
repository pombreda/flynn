import Modal from '../modal';
import Dispatcher from '../../dispatcher';
import PrettySelect from '../pretty-select';

var Credentials = React.createClass({
	render: function () {
		return (
			<Modal visible={true} onHide={this.__handleHide}>
				<h2>Credentials</h2>

				<PrettySelect>
					<option value="aws">AWS</option>
					<option value="digital_ocean">Digital Ocean</option>
				</PrettySelect>
			</Modal>
		);
	},

	componentDidMount: function () {
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

	__handleHide: function () {
		Dispatcher.dispatch({
			name: 'NAVIGATE',
			path: '/'
		});
	}
});
export default Credentials;
