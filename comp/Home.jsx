/** @jsx React.DOM
 *
 * Main menu.
 */

'use strict'

var _ = require('lodash');
var Screens = require('./ScreenTypes.js');
var Battle = require('../act/Battle.js');

module.exports = React.createClass({
	handleCustomSkirmish: function(){
		Battle.openSinglePlayerBattle('Custom Skirmish', function(){
			this.setEngine('96.0');
			this.setGame('Evolution RTS - v8.04');
			this.setMap('OnyxCauldron1.6');
		});
	},
	render: function(){
		return (<div className="homeScreen">
			<button>Multiplayer</button>
			<button onClick={this.handleCustomSkirmish}>Custom Skirmish</button>
			<button onClick={_.partial(this.props.onSelect, Screens.SETTINGS)}>Settings</button>
		</div>);
	}
});
