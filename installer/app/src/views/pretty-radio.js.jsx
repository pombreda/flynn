import Colors from './css/colors';
import Sheet from './css/sheet';

var PrettyRadio = React.createClass({
	getDefaultProps: function () {
		return {
			disabled: false,
			checked: false,
			name: '',
			onChange: function(){}
		};
	},

	getInitialState: function () {
		var styleEl = Sheet.createElement({
			position: 'relative',
			display: 'block',
			width: '100%',
			height: '100%',

			selectors: [
				[':before', {
					display: 'table',
					content: '" "'
				}],

				[':after', {
					display: 'table',
					content: '" "',
					clear: 'both'
				}],

				['> *', {
					boxSizing: 'content-box'
				}],

				['> input[type=radio]', {
					position: 'absolute',
					left: '50%',
					marginLeft: '-10px',
					width: '20px',
					height: '20px',
					clip: 'rect(0 0 0 0)'
				}],

				['> input[type=radio] + [data-dot]', {
					display: 'block',
					position: 'absolute',
					left: '50%',
					marginLeft: '-10px',
					width: '20px',
					height: '20px',
					borderRadius: '10px',
					backgroundColor: Colors.whiteColor,
					border: '1px solid '+ Colors.grayBlueColor,
					boxShadow: 'inset 0px 0px 1px '+ Colors.grayBlueColor
				}],

				['> input[type=radio][disabled] + [data-dot]', {
					display: 'none'
				}],

				['> input[type=radio][checked] + [data-dot]:before', {
					display: 'block',
					position: 'absolute',
					top: '3px',
					left: '3px',
					width: '14px',
					height: '14px',
					borderRadius: '7px',
					backgroundColor: Colors.greenColor,
					content: '" "',
				}]
			]
		}, this.props.style || {});
		return {
			styleEl: styleEl
		};
	},

	render: function () {
		return (
			<label id={this.state.styleEl.id}>
				{this.props.children}
				<input disabled={this.props.disabled} name={this.props.name} onChange={this.props.onChange} type="radio" checked={this.props.checked} />
				<div data-dot />
			</label>
		);
	},

	componentDidMount: function () {
		this.state.styleEl.commit();
	}
});
export default PrettyRadio;
