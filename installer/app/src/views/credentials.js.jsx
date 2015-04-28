import { List, ListItem } from './list';

var Credentials = React.createClass({
	render: function () {
		return (
			<div>
				<h2>Credentials</h2>

				<List>
					<ListItem path="/credentials/new">New</ListItem>
				</List>
			</div>
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
	}
});
export default Credentials;
