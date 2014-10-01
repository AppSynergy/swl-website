/** @jsx React.DOM */

'use strict'

var Reflux = require('reflux');
var _ = require('lodash');
var Server = require('../act/LobbyServer.js');
var ServerStore = require('../store/LobbyServer.js');
var UserItem = require('./UserItem.jsx');

module.exports = React.createClass({
	mixins: [Reflux.listenTo(ServerStore, 'update')],
	getInitialState: function(){
		return {};
	},
	update: function(data){
		this.setState(data.users);
	},
	render: function(){
		return (<ul className="userList">
			{_.keys(this.state).sort().map(function(x){
				return <UserItem key={this.state[x].name} user={this.state[x]} />;
			}.bind(this))}
		</ul>);
	}
});
