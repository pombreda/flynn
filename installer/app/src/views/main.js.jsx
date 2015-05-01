import Sheet from './css/sheet';
import Panel from './panel';
import Clusters from './clusters';
import RouteLink from './route-link';
import BtnCSS from './css/button';

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
		var credsBtnStyleEl = Sheet.createElement(BtnCSS, {
			position: 'absolute',
			bottom: '20px',
			right: '20px'
		});
		return {
			styleEl: styleEl,
			credsBtnStyleEl: credsBtnStyleEl
		};
	},

	render: function () {
		return (
			<div id={this.state.styleEl.id}>
				<div>
					<Panel style={{ height: '100%', position: 'relative', paddingBottom: 80 }}>
						<Clusters dataStore={this.props.dataStore} />
						<RouteLink
							path='/credentials'
							id={this.state.credsBtnStyleEl.id}>Credentials</RouteLink>
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
		this.state.credsBtnStyleEl.commit();
	}
});
export default Main;
