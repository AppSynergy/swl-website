///////////////////////////////////

// JS Spring Lobby Interface

// By CarRepairer

// License: GPL 2

///////////////////////////////////

define(
	'lwidgets/Chat',
	[
		"dojo/_base/declare",
		
		'dojo/query',
		'dojo/_base/array',
		'dojo/dom-construct',
		'dojo/dom-style',
		'dojo/dom-attr',
		'dojo/_base/lang',
		'dojo/topic',
		'dojo/_base/event',
		'dojo/on',
		
		'dijit/_WidgetBase',
		'dijit/_TemplatedMixin',
		'dijit/_WidgetsInTemplateMixin',
		//extras
		
		'dojox/html/entities',
		//,'dojox/av/FLAudio'
		
		
	],
	function(declare,
		query,
		array, domConstruct, domStyle, domAttr, lang, topic, event, on,
		WidgetBase, Templated, WidgetsInTemplate ){
	return declare([ WidgetBase, Templated, WidgetsInTemplate ], {
	
	
	subscriptions:null,
	
	mainContainer:null,
	messageNode:'',
	name:'',
	nick:'',
	
	prevCommands:null,
	curPrevCommandIndex:0,
	
	startMeUp:true,
	
	users:null,	//mixed in
	settings:null,
	
	nickCompleteIndex:0,
	nickCompleteWord:'',
	nickCompleteNicks:null,
	allowNotifySound:true,
	
	lastNickSourceShown:'',
	showedNickSource:false,
	
	
	'postCreate' : function()
	{
		this.prevCommands = [];
		this.subscriptions = [];

		//setTimeout( function(thisObj){ topic.publish('SetChatStyle') }, 1000, this );
		
		this.addSubscription( this.subscribe('SetNick', 'setNick' ) );
		this.addSubscription( this.subscribe('Lobby/setAllowNotifySound', 'setAllowNotifySound' ) );
		
		//dumb hax
		/**/
		this.addSubscription( this.subscribe('ResizeNeeded', function(){
			setTimeout( function(thisObj){
				thisObj.resizeAlready();
			}, 1, this );
		} ) );
		/**/
		//this.addSubscription( this.subscribe('ResizeNeeded', 'resizeAlready' ) );
		
		this.addSubscription( this.subscribe('Lobby/chime', function(data){
			this.addLine( data.chimeMsg, 'chatAlert' );
		} ) );
		
		this.messageNode.on('mouseup', lang.hitch(this, 'messageNodeMouseUp'))
		
		this.postCreate2();

	},
	
	showLog:function()
	{
		domConstruct.create('hr', {}, this.messageNode.domNode, 'first' )
		domConstruct.create('div', { innerHTML: this.log.replace(/\n/g, '<br />') }, this.messageNode.domNode, 'first' )
	},
	
	setAllowNotifySound:function( val )
	{
		this.allowNotifySound = val;
	},
	
	'destroyMe':function()
	{
		if( this.playerListNode )
		{
			//echo('destroy playerlist error')
			//this.playerListNode.destroyRecursive();	
		}
		
		if( this.subscriptions )
		{
			array.forEach(this.subscriptions, function(subscription){
				subscription.remove()
			});
		}
		//echo('destroy chat error')
		//this.destroyRecursive();
		
	},
	
	'setNick':function(data)
	{
		this.nick = data.nick;
	},
	
	'addSubscription':function( handle )
	{
		this.subscriptions.push( handle );
	},
	
	'postCreate2':function()
	{
	},
	
	getSelectedText:function()
	{
		var html = "";
		if (typeof window.getSelection != "undefined") {
			var sel = window.getSelection();
			if (sel.rangeCount) {
				var container = document.createElement("div");
				for (var i = 0, len = sel.rangeCount; i < len; ++i) {
					container.appendChild(sel.getRangeAt(i).cloneContents());
				}
				html = container.innerHTML;
			}
		} else if (typeof document.selection != "undefined") {
			if (document.selection.type == "Text") {
				html = document.selection.createRange().htmlText;
			}
		}
		return html;
	},
	messageNodeMouseUp:function(e)
	{
		if( this.getSelectedText() !== '' )
		{
			return;
		}
		this.focusTextNode();
	},
	
	focusTextNode:function(e)
	{
		this.textInputNode.focus();
	},
	
	'keydown':function(e)
	{
		var cursorPos, curText, words, curWord, curTextLeft, curTextRight, joinedNicks
		if(e.keyCode === 9) //tab
		{
			event.stop(e);
			cursorPos = this.textInputNode.selectionStart;
			
			curText = this.textInputNode.value;
			curTextLeft = curText.substring(0,cursorPos);
			curTextRight = curText.substring(cursorPos);
			words = curTextLeft.split(' ');
			curWord = words.pop();
			
			if( curWord === '' )
			{
				return;
			}
			
			if( this.nickCompleteWord === '' )
			{
				this.nickCompleteWord = curWord;
				joinedNicks = '';
				for(user in this.players)
				{
					joinedNicks += ' ' + user;
				}
				this.nickCompleteNicks = joinedNicks.match(new RegExp('[^ ]*'+ this.nickCompleteWord.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&") +'[^ ]*', 'gi') );
			}
			
			if( this.nickCompleteNicks !== null )
			{
			
				curWord = this.nickCompleteNicks[this.nickCompleteIndex];
				words.push(curWord);
				curTextLeft = words.join(' ');
				this.textInputNode.value = curTextLeft + curTextRight;
				this.textInputNode.selectionStart = curTextLeft.length;
				this.textInputNode.selectionEnd = curTextLeft.length;
				
				this.nickCompleteIndex+=1;
				this.nickCompleteIndex %= this.nickCompleteNicks.length;
			}
		}
		else
		{
			this.nickCompleteNicks = null;
			this.nickCompleteIndex = 0;
			this.nickCompleteWord = '';
		}
	},
	
	'keyup':function(e)
	{
		var prevCommand;
		//up = 38, down = 40
		if(e.keyCode === 38)
		{
			this.curPrevCommandIndex += 1;
		}
		if(e.keyCode === 40)
		{
			this.curPrevCommandIndex -= 1;
		}
		if(e.keyCode === 38 || e.keyCode === 40)
		{
			this.curPrevCommandIndex = Math.min(this.curPrevCommandIndex, this.prevCommands.length-1)
			this.curPrevCommandIndex = Math.max(this.curPrevCommandIndex, 0)
			prevCommand = this.prevCommands[ this.curPrevCommandIndex ]
			if( typeof prevCommand !== 'undefined' )
			{
				this.textInputNode.value = this.prevCommands[ this.curPrevCommandIndex ];
			}
			return;	
		}
		
		//enter
		if(e.keyCode === 13)
		{
			this.curPrevCommandIndex = -1;
			msg = this.textInputNode.value;
		
			this.prevCommands.remove(msg);
			this.prevCommands.unshift(msg);
			if( this.prevCommands.length > 20 )
			{
				this.prevCommands.pop();
			}
			
			this.sendMessage(msg);
			this.textInputNode.value = '';
		}
		
	},
	
	'sendMessage':function(msg)
	{
		var smsg, msg_arr, rest, thisName;
		
		msg_arr = msg.split(' ');
		cmd = msg_arr[0];
		
		thisName = '';
		if( this.name !== '' )
		{
			thisName = this.name + ' ';
		}
		
		if( cmd == '/me' )
		{
			rest = msg_arr.slice(1).join(' ')
			smsg = this.saystring + 'EX ' + thisName + rest;
		}
		else
		{
			smsg = this.saystring + ' ' + thisName + msg;
		}
		topic.publish( 'Lobby/notidle', {} );
		topic.publish( 'Lobby/rawmsg', {'msg':smsg } );
		
	},
	
	'scrollToBottom':function()
	{
		var node = this.messageNode.domNode;
		node.scrollTop = node.scrollHeight - node.clientHeight;
	},
	
	
	writeLog:function( type, logFile, line )
	{
		topic.publish( 'Lobby/writeLog', type, logFile, line )
	},
	
	
	addLine:function(line, lineClass, timeStamp, source )
	{
		var toPlace, newNode, date, timeStamp2;
		var sourceStyle;
		var sourceClass;
		var sourceOut;
		var lineSourceDiv, lineMessageDiv, timeStampDiv, selectLink
		var sourceLink;
		
		date = new Date();
		if( timeStamp && timeStamp !== 'Offline' )
		{
			date = new Date( Date.parse(timeStamp) - (new Date()).getTimezoneOffset()*60000 );
		}
		timeStamp2 = '[' + date.toLocaleTimeString() + ']';
		
		if( timeStamp )
		{
			timeStamp2 = '<i>' + timeStamp2 + '</i>';
		}
		
		if( source !== null && typeof source !== 'undefined' &&
			( this.chatType === 'user' || this.chatType === 'channel' )
		)
		{
			this.writeLog( this.chatType, this.name, timeStamp2 + ' '+ source +': ' + line );
		}
		
		toPlace = this.messageNode.domNode;
		
		if( source === null || typeof source === 'undefined' )
		{
			source = ''
		}
		if( lineClass === null || typeof lineClass === 'undefined' )
		{
			lineClass = ''
		}
		
		sourceOut = '***' + source;
		sourceStyle = '';
		sourceLinkStyle = '';
		sourceClass = '';
		
		if( lineClass === 'chatJoin' )
		{
			
		}
		else if( lineClass === 'chatLeave' )
		{
			
		}
		else if( lineClass === 'chatMine' )
		{
			sourceOut = source;
			sourceStyle = {
				borderRight:'1px solid ' + this.settings.settings.mainTextColor
			};
			if( typeof this.playerListNode !== 'undefined' )
			{
				sourceLink = true;
				sourceLinkStyle = {
					textDecoration:'none',
				}
			}
			sourceClass = 'chatNick';
		}
		else if( lineClass === 'chatAction' )
		{
			
			sourceOut = '*';
			line = source + ' ' + line;
			sourceClass = lineClass;
		}
		else if( lineClass === 'chatAlert' )
		{
			sourceClass = lineClass;
		}
		else
		{
			if( typeof this.playerListNode !== 'undefined' )
			{
				sourceLink = true;
				sourceLinkStyle = {
					textDecoration:'none',
				}
			}
			
			sourceOut = source
			sourceStyle = {
				borderRight:'1px solid ' + this.settings.settings.mainTextColor
			};
			sourceClass = 'chatNick';
		}
		
		if( sourceStyle === '' )
		{
			sourceClass = lineClass;
		}
		
		sourceOut = dojox.html.entities.encode(sourceOut) + '&nbsp;';
		
		if( source !== this.nick && this.nick !== '' && line.toLowerCase().search( this.convertedNick() ) !== -1 )
		{
			lineClass = 'chatAlert';
			if( this.settings.settings.nickHiliteSound && this.allowNotifySound )
			{
				playSound('./sound/alert.ogg')
			}
			
		}
		
		line = makeLinks(line, this.settings.settings.linkColor);
		
		newNode = domConstruct.create('div', {
			style:{ display:'table-row' },
		}, toPlace )
		
		timeStampDiv= domConstruct.create('div', {
			innerHTML: timeStamp2 + '&nbsp;',
			style:{
				display:'table-cell',
				minWidth:'50px',
				whiteSpace:'nowrap',
				letterSpacing:'-1px',
				verticalAlign:'top',
				paddingTop:'3px',
			}
		}, newNode );
		
		lineSourceDiv = domConstruct.create('div', {}, newNode );
		domStyle.set(lineSourceDiv, {
			display:'table-cell',
			minWidth:'50px',
			whiteSpace:'nowrap',
			textAlign:'right',
			verticalAlign:'top',
			paddingTop:'3px',
		} )
		domStyle.set(lineSourceDiv, sourceStyle )
		
		
		if( source !== this.lastNickSourceShown )
		{
			this.showedNickSource = false;
		}
		
		if( sourceLink )
		{
			if( !this.showedNickSource )
			{
				selectLink = domConstruct.create('a', {
					innerHTML:sourceOut,
					style:sourceLinkStyle,
					'class':sourceClass,
					href:'#',
					onclick:lang.hitch(this, function(e){
						event.stop(e);
						this.playerListNode.selectUser(source)
					})
				}, lineSourceDiv, 'only' );
				this.showedNickSource = true;
				this.lastNickSourceShown = source;
			}
		}
		else
		{
			domAttr.set(lineSourceDiv, {
				innerHTML: sourceOut,
				'class':sourceClass
			})
		}
		
		
		lineMessageDiv = domConstruct.create('div', {
			innerHTML: line,
			style:{
				display:'table-cell',
				paddingLeft:'3px',
				paddingTop:'3px',
				verticalAlign:'top'
			},
			class : lineClass
		}, newNode );
		
		//add icon to load image
		query('a', lineMessageDiv).forEach(function(linkNode){
			//var newImg
			var href
			var showLink, showLinkImg;
			var youtubeMatch
			var youtubeMatch2
			var youtubeId
			
			href = linkNode.href
			if( href.search('\.(bmp|gif|ico|jpg|jpeg|png)$') !== -1 )
			{
				showLink = domConstruct.create( 'a', {
					href:'#',
					onclick:lang.hitch(this, function(e){
						var newImg
						event.stop(e)
						newImg = domConstruct.create('img', {
							align:'top',
							src: href,
							onload:lang.hitch(this, function(){
								this.scrollToBottom();
							})
						})
						domConstruct.place( newImg, linkNode, 'only' );
						domConstruct.destroy(showLink);
					})
				} );
				
				showLinkImg = domConstruct.create( 'img', {
					src:'img/webdown.png',
					align:'top',
					onload:lang.hitch(this, function(){
						this.scrollToBottom();
					})
				}, showLink);
				
				domConstruct.place( showLink, linkNode, 'after' );
				
			} //linkNode.href.search
			else
			{
				youtubeMatch = href.match( /^http:\/\/www\.youtube\.com\/watch\?v=(.*)$/);
				youtubeMatch2 = href.match( /^http:\/\/youtu\.be\/(.*)$/);
				
				youtubeId = '';
				if( youtubeMatch && youtubeMatch.length > 1 )
				{
					youtubeId = youtubeMatch[1];
				}
				if( youtubeMatch2 && youtubeMatch2.length > 1 )
				{
					youtubeId = youtubeMatch2[1];
				}
				
				if( youtubeId !== '' )
				{
					showLink = domConstruct.create( 'a', {
						href:'#',
						onclick:lang.hitch(this, function(e){
							var newImg
							var youtubeVid
							event.stop(e)
							
							youtubeVid = domConstruct.create('iframe',{
								width:"560",
								height:"315",
								src:"http://www.youtube.com/embed/" + youtubeId,
								frameborder:"0",
								allowfullscreen:'allowfullscreen',
								
								//does below work?
								onload:lang.hitch(this, function(){
									this.scrollToBottom();
								})
							})
							domConstruct.place( youtubeVid, linkNode, 'after' );
							
							domConstruct.place( youtubeVid, linkNode, 'only' );
							domConstruct.destroy(showLink);
						})
					} );
					
					showLinkImg = domConstruct.create( 'img', {
						src:'img/youtube.png',
						align:'top',
						onload:lang.hitch(this, function(){
							this.scrollToBottom();
						})
					}, showLink);
					
					domConstruct.place( showLink, linkNode, 'after' );
				
				
					
				}
			}
		}, this); //add icon to load image
		
		//fixme: hidden join/leaves will cause confusing removal of chat lines
		while( toPlace.children.length > parseInt(this.settings.settings.chatLogSize) )
		{
			domConstruct.destroy( toPlace.firstChild );
		}

		var node = this.messageNode.domNode;
		if( node.scrollTop > node.scrollHeight - node.clientHeight * 1.7 )
		{
			this.scrollToBottom();
		}
	},
	
	'playerMessage':function( data )
	{
		var pname, msg, lineClass, nameStyle, nameClass, timeStamp;
		var source;
		
		if(data.channel !== this.name && data.userWindow !== this.name && data.battle === undefined )
		{
			return;
		}
		
		msg = data.msg;
		msg = dojox.html.entities.encode(msg);
		pname = data.name;
		
		source = pname;
		
		lineClass = '';
		
		if(data.ex)
		{
			lineClass = 'chatAction';
			
			/*
			//testing
			source = null;
			msg = pname + ' ' + msg;
			*/
		}
		else if(pname == this.nick)
		{
			lineClass = 'chatMine';
		}
		
		timeStamp = data.time ? data.time : false;
		
		this.addLine( msg, lineClass, timeStamp, source );
	},
	
	//because .search treats [] as though it's a character class for a regular expression, even if the parameter is a plain string!?
	'convertedNick':function()
	{
		return this.nick.toLowerCase().replace( /\[/, '\\[' ).replace( /\]/, '\\]' )
	},
	
	//stupid hax
	'resizeAlready':function()
	{
		this.mainContainer.resize();
		this.resizeAlready2();
	},
	'resizeAlready2':function()
	{
	},
	
	'startup2':function()
	{
		//sucky hax
		if( this.startMeUp )
		{
			this.startMeUp = false;
			this.mainContainer.startup();
		}
	},

	'blank':null
}); }); //declare lwidgets.Chatroom
