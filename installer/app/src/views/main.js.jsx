import Sheet from './css/sheet';
import Panel from './panel';
import Clusters from './clusters';
import Credentials from './credentials';

var Main = React.createClass({
	getInitialState: function () {
		var styleEl = Sheet.createElement({
			margin: '16px',
			display: 'flex',
			selectors: [
				['> *:first-of-type', {
					marginRight: '16px',
					maxWidth: '360px',
					minWidth: '300px',
					flexBasis: '360px'
				}],
				['> *', {
					flexGrow: 1
				}]
			]
		});
		return {
			styleEl: styleEl
		};
	},

	render: function () {
		return (
			<div id={this.state.styleEl.id}>
				<div>
					<Panel style={{ height: '100%' }}>
						<Clusters dataStore={this.props.dataStore} />
						<Credentials dataStore={this.props.dataStore} />
					</Panel>
				</div>

				<div>
					{this.props.children}
				</div>
			</div>
		);
	},

	componentDidMount: function () {
		this.state.styleEl.commit();
	}
});
export default Main;
