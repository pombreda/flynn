import Colors from './css/colors';
import RouteLink from './route-link';
import Sheet from './css/sheet';

var List = React.createClass({
	getInitialState: function () {
		var styleEl = Sheet.createElement({
			listStyle: 'none',
			margin: 0,
			padding: 0
		}, this.props.style || {});
		return {
			styleEl: styleEl
		};
	},

	render: function () {
		return (
			<ul id={this.state.styleEl.id}>
				{this.props.children}
			</ul>
		);
	},

	componentDidMount: function () {
		this.state.styleEl.commit();
	}
});

var ListItem = React.createClass({
	getInitialState: function () {
		var baseCSS;
		if (this.props.path) {
			baseCSS = {
				selectors: [
					['> a', {
						color: 'inherit',
						textDecoration: 'none',
						padding: '0.5em 1em',
						display: 'block'
					}]
				]
			};
		} else {
			baseCSS = {
				padding: '0.5em 1em'
			};
		}
		var styleEl = Sheet.createElement(baseCSS, this.props.selected ? {
			backgroundColor: Colors.greenColor,
			color: Colors.whiteColor
		} : {}, this.props.style || {});
		return {
			styleEl: styleEl
		};
	},

	render: function () {
		var wrappedChildren = this.props.children;
		if (this.props.path) {
			wrappedChildren = (
				<RouteLink
					path={this.props.path}
					params={this.props.params || [{}]}>
					{this.props.children}
				</RouteLink>
			);
		}
		return (
			<li id={this.state.styleEl.id}>
				{wrappedChildren}
			</li>
		);
	},

	componentDidMount: function () {
		this.state.styleEl.commit();
	}
});

export { List, ListItem };
