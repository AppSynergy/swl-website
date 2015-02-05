/*
 * This is a proxy store that routes to the correct protocol implementation.
 * When connecting it creates the appropriate store based on the welcome
 * message from the server. After disconnecting the store is destroyed, but the
 * last state snapshot is retained.
 *
 * The underlying protocol store must implement the following:
 *  - dispose() method that gets called before disconnecting and destroying the store.
 *  - The broadcasted state must be the same as specified in getClearState().
 *  - It should look in the registering property to determine if we're registering.
 */

'use strict'

var _ = require('lodash');
var Reflux = require('reflux');
var Applet = require('./Applet.js');
var Log = require('../act/Log.js');
var Settings = require('./Settings.js');
var ServerCommon = require('./LobbyServerCommon.js');

var SpringLobbyServer = require('./SpringLobbyServer.js');
var ZkLobbyServer = require('./ZkLobbyServer.js');

module.exports = Reflux.createStore({
	listenables: require('../act/LobbyServer.js'),

	init: function(){
		this.underlyingStore = null;
		this.state = ServerCommon.getClearState();

		// Socket handlers for C++ API.
		window.on_socket_get = this.message.bind(this);
		window.on_socket_error = this.onError.bind(this);
	},
	getInitialState: function(){
		return ServerCommon.getClearState();
	},
	triggerSync: function(){
		this.trigger(this.state);
	},

	underlyingStoreUpdate: function(state){
		this.state = state;
		this.triggerSync();
	},

	// Action listeners.

	connect: function(){
		this.connectInternal(null);
	},
	disconnect: function(){
		if (Applet)
			Applet.disconnect();
		else
			this.socket.close();
		this.state.connection = ServerCommon.ConnectionState.DISCONNECTED;
		if (this.underlyingStore) {
			this.stopListeningTo(this.underlyingStore);
			this.underlyingStore.dispose();
			this.underlyingStore = null;
		}
		this.triggerSync();
	},
	register: function(name, password, email){
		if (this.state.connection !== ServerCommon.ConnectionState.DISCONNECTED)
			this.disconnect();
		this.connectInternal({ name: name, password: password, email: email });
	},

	// Other methods.

	connectInternal: function(registering){
		if (this.state.connection !== ServerCommon.ConnectionState.DISCONNECTED)
			this.disconnect();
		if (Applet) {
			var host = Settings.lobbyServer.split(':')[0] || 'lobby.springrts.com';
			var port = Settings.lobbyServer.split(':')[1] || '8200';
			Applet.connect(host, port);
		} else {
			this.socket = new WebSocket('ws://springrts.com:8260');
			this.socket.onmessage = _.compose(this.message, function(obj){ return obj.data; }).bind(this);
			this.socket.onerror = this.socket.onclose = this.onError.bind(this);
		}
		this.state = ServerCommon.getClearState();
		this.state.socket = this.socket;
		this.state.connection = ServerCommon.ConnectionState.CONNECTING;
		this.state.registering = registering;
		this.triggerSync();
	},
	message: function(msg){
		if (this.underlyingStore === null) {
			if (msg.match(/^TASServer/)) {
				this.underlyingStore = SpringLobbyServer();
			} else if (msg.match(/^Welcome {/)) {
				this.underlyingStore = ZkLobbyServer();
			} else {
				Log.errorBox('Unsupported server protocol\nUnrecognized welcome message: ' + msg);
				this.disconnect();
				return;
			}

			_.extend(this.underlyingStore, this.state);
			this.listenTo(this.underlyingStore, this.underlyingStoreUpdate.bind(this));
		}
		this.underlyingStore.message(msg);
	},
	onError: function(){
		this.disconnect();
	},
});
