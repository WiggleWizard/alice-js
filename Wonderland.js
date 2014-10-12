/**
 * 
 * Written by: Terence-Lee "Zinglish" Davis.
 *
 * This was not written to be modified, only extended
 * and used as a library.
 *
 * Do not modify unless you know exactly what you are doing.
 * 
 */

/* NodeJS Libs */
var Net   = require('net');
var Async = require('async');

/* Static User Libs */
var EventParser  = require('./EventParser.js');
var Utils        = require('./Utils.js');

/* User Objects */
var VoidFunction   = require('./VoidFunction.js');
var ReturnFunction = require('./ReturnFunction.js');
var Player         = require('./Player.js');
var GeoIP          = require('./GeoIP.js');
var Database       = require('./Database.js');


function Wonderland()
{
	this._rabbitHolePath = "";
	this._rabbitHoleSock = null;

	// Connect to the DB immediately
	this._db = new Database();
	this._db.ConnectUsing("./database_config.json");
	this._dbConn = this._db._dbConn; // Easier ref
	
	// Binds
	this._eventBindsOnAliceInit  = new Array();
	this._eventBindsOnChat       = new Array();
	this._eventBindsOnNameChange = new Array();
	this._eventBindsOnStatusReq  = new Array();
	this._eventBindsOnJoinReq    = new Array();
	this._eventBindsOnJoin       = new Array();
	this._eventBindsOnDisconnect = new Array();
	
	// Stored return functions for callback execution upon return
	this._stackReturnFunctions = {};
	
	// General declarations
	this._initialized = false;
	this._maxClients = 0;
	this._players    = new Array();
	this._geoIP      = new GeoIP();

	// Initialize the module
	this._GetFreeRabbithole();
}

Wonderland.prototype = {

/***********************************************\
|* PUBLIC
\***********************************************/
	
	/* ============ GENERAL USE
	\* ========================================== */
	
	/**
	 * Binds a function to an event.
	 * 
	 * @param {[type]}   eventName [description]
	 * @param {Function} callback  [description]
	 */
	BindFunctionToEvent: function(func, eventName)
	{

		if(eventName === 'aliceinit')
			this._eventBindsOnAliceInit.push(func);
		else if(eventName === 'chat')
			this._eventBindsOnChat.push(func);
		else if(eventName === 'namechange')
			this._eventBindsOnNameChange.push(func);
		else if(eventName === 'statusreq')
			this._eventBindsOnStatusReq.push(func);
		else if(eventName === 'joinreq')
			this._eventBindsOnJoinReq.push(func);
		else if(eventName === 'join')
			this._eventBindsOnJoin.push(func);
		else if(eventName === 'disconnect')
			this._eventBindsOnDisconnect.push(func);
		else
			console.log('WARN: No event named "' + eventName + '"')

	},

	/**
	 * Finds only a handful of players by partial name. This is a case insensitive search.
	 * 
	 * @param  {string} needle - Partial or full name.
	 * @return {array}         - Array of slot/index IDs of each player matched. Null if
	 *                           no players found.
	 */
	FindPlayerIDsByPartName: function(needle)
	{
		// Names cannot be longer than 14 characters so why waste the time trying to
		// look for one? ;)
		if(needle.length > 14)
			return null;

		var found = [];

		needle = needle.toLowerCase();

		var i, len, player, playerName;
		for(i = 0, len = this.GetMaxClients() ; i < len ; i++)
		{
			player = this._players[i];

			if(player.IsConnected())
			{
				playerName = player.GetName().toLowerCase();

				if(playerName.search(needle) >= 0)
					found.push(player);
			}
		}

		// GC
		i = null;
		len = null;
		player = null;
		playerName = null;

		return found.length > 0 ? found : null;
	},

	/**
	 * Finds a player on the server. Takes both player ID and partial name
	 * notational strings.
	 * 
	 * @param  {[type]} needle [description]
	 * @return {Player}        Will return NULL if no players are found.
	 */
	FindPlayers: function(needle)
	{
		var playersFound = [];
		var playerID;

		if((playerID = Utils.ToInt(needle)) != null)
		{
			player = this._players[playerID];

			if(player.IsConnected())
				playersFound[0] = player;
			else
				playersFound = null;
		}
		else
			playersFound = this.FindPlayerIDsByPartName(needle);

		return playersFound;
	},
	
	/* ============ VOID FUNCTIONS
	\* ========================================== */
	
	/**
	 * Broadcasts a chat message across the entire server.
	 * 
	 * @param {[type]} message [description]
	 */
	BroadcastChat: function(message)
	{
		var argv = [message];
		var argt = [3];
		
		var voidFunc = new VoidFunction("BCASTCHAT", argv, argt);

		this._SendVoidFunction(voidFunc);
	},

	JoinRequestDeny: function(ipAddress, qPort, message)
	{
		var argv = [ipAddress, qPort, message];
		var argt = [3, 1, 3];
		
		var voidFunc = new VoidFunction("LIMBODENY", argv, argt);

		this._SendVoidFunction(voidFunc);
	},

	JoinRequestAccept: function(ipAddress, qPort)
	{
		var argv = [ipAddress, qPort];
		var argt = [3, 1];
		
		var voidFunc = new VoidFunction("LIMBOACCEPT", argv, argt);

		this._SendVoidFunction(voidFunc);
	},
	
	/* ============ RETURN FUNCTIONS
	\* ========================================== */
	
	GetMaxClients: function(callback)
	{
		return this._maxClients;
	},


/***********************************************\
|* PRIVATE
\***********************************************/

	/**
	 * This is only ever called AFTER the CoD4 server is initialized correctly.
	 *
	 * Function probably needs some work.
	 */
	_Initialize: function()
	{
		console.log("Alice initializing");

		var self = this;
		
		// Create an array of empty players
		for(var i=0; i < this._maxClients; i++)
		{
			this._players[i] = new Player(this);
		}
		
		// Construct all the currently connected players (This is mostly important
		// if Alice was started after server has been initialized).
		var returnFunc = new ReturnFunction(2, "PLAYERDATA", [], [], function(playerData)
		{
			var playersBuilt = 0;

			// Parse the player data
			var lines = playerData.split('\n');
			var linec = lines.length;

			// Create async task list to initialize players
			var asyncTasks = [];
			lines.forEach(function(line)
			{
				asyncTasks.push(function(callback)
				{
					if(line === "")
					{
						callback();
						return;
					}

					var playerInfo = line.split('\\\\');
					var slotID = parseInt(playerInfo[0]);

					self._geoIP.Locate(playerInfo[1], function(geoData)
					{
						self._players[slotID].Initialize(slotID, playerInfo[1], playerInfo[2], playerInfo[3], geoData, function() {});

						callback();
					});
				});
			});

			// Once all players are initialized correctly, then call any bound functions
			Async.parallel(asyncTasks, function()
			{
				self._ExecBoundFunctionsOnAliceInit();
			});

		});
		this._SendReturnFunction(returnFunc);
	},
	
	/**
	 * Called when the Rabbit Hole connection has been properly made. If the server
	 * hasn't been initialized correctly then it will wait for that event to fire instead.
	 */
	_RabbitHoleInit: function()
	{
		var self = this;

		// Get the max clients from the server when Alice starts up,
		// if there's no max clients then Alice will wait for the Common Init.
		var returnFunc = new ReturnFunction(1, "GETMAXCLIENTS", [], [], function(maxClients)
		{
			if(parseInt(maxClients) != 0)
			{
				self._maxClients = parseInt(maxClients);
				console.log("Max clients: " + self._maxClients);
				
				self._initialized = true;
				
				self._Initialize();
			}
		});
		this._SendReturnFunction(returnFunc);
	},
	
	/**
	 * Called when the actual CoD4 server is properly initialized.
	 */
	_ServerInit: function()
	{
		var self = this;

		// Get the max clients from the server
		var returnFunc = new ReturnFunction(1, "GETMAXCLIENTS", [], [], function(maxClients)
		{
			if(self._initialized === false)
			{
				self._maxClients = parseInt(maxClients);
				console.log("Max clients: " + self._maxClients);
				
				self._initialized = true;
				
				self._Initialize();
			}
		});
		this._SendReturnFunction(returnFunc);
	},
	
	/* ============ SOCKET BUILDERS
	\* ========================================== */

	/**
	 * Contacts the IPC Delegator on a Unix Domain Socket that Wonderland
	 * creates and gets a rabbit hole so the addon can communicate with
	 * the Wonderland instance. It then ends the connection because it will
	 * connect to the Rabbit hole and communicate there.
	 */
	_GetFreeRabbithole: function()
	{
		var self = this;

		// Attempt to connect to Wonderland and request a rabbit hole
		var ipcDelegatorSock = Net.connect({path: "/tmp/wonderland-alicetest"}, function()
		{
			console.log("Connection made to Wonderland, requesting a rabbit hole");

			// Prepare the packet variables
			var command = "RABBITHOLE";
			var packet  = new Buffer(8 + command.length);

			packet.writeUInt32BE(1, 0);               // Version
			packet.writeUInt32BE(command.length, 4);  // Payload length
			packet.write(command, 8, command.length); // Payload

			// Send the rabbit hole request
			ipcDelegatorSock.write(packet);
		});

		ipcDelegatorSock.on('data', function(data)
		{
			// We have to parse the payload, because there is an int
			// at the beginning telling us how long the payload is.
			var buf = new Buffer(data);
			self._rabbitHolePath = buf.toString('utf8', 4, data.length);

			console.log("Rabbit hole path received: " + self._rabbitHolePath);

			// Close comms with IPC Delegator			
			ipcDelegatorSock.end();

			// Try connect to the newly requested rabbit hole
			self._ConnectToRabbitHole();
		});
	},

	_ConnectToRabbitHole: function()
	{
		var self = this;

		// Attempt connection to the rabbit hole
		this._rabbitHoleSock = Net.connect({path: this._rabbitHolePath}, function()
		{
			console.log("Rabbit hole connection made to " + self._rabbitHolePath);
			
			self._RabbitHoleInit();
		});

		// When the Rabbit hole receives data, parse the data and attempt to
		// execute anything that's parsed.
		this._rabbitHoleSock.on('data', function(data)
		{
			var buffer = new Buffer(data);
			self._AnalyzePacket(buffer);
		});
	},



	/* ============ INTERNAL CALLBACKS
	\* ========================================== */

	/**
	 * Called when the actual server has been initialized correctly. Never called
	 * if the server's already initialized
	 */
	_OnJoinRequest: function(ipAddress, qPort, callback)
	{
		// Geolocate the player
		this._geoIP.Locate(ipAddress, function(geoData)
		{
			// Once done, execute the callback with the geo locational data
			callback(geoData);
		});
	},
	_OnJoin: function(slotID, ipAddress, guid, name, callback)
	{
		// Initialize the player on this slot correctly, this involves getting permissions
		// from database too if applicable.
		var geoData = this._geoIP.LocateFromCache(ipAddress, true); // Rely on cache
		this._players[slotID].Initialize(slotID, ipAddress, guid, name, geoData, callback);
	},
	_OnDisconnect: function(slotID)
	{
		// De-initialize player properties
		this._players[slotID]._connected = false;
	},
	
	
	/* ============ IPC
	\* ========================================== */
	
	/**
	 * Sends a void function call to Wonderland.
	 * 
	 * @param VoidFunction func Uncompiled VoidFunction object.
	 */
	_SendVoidFunction: function(func)
	{
		func.Compile();
		this._rabbitHoleSock.write(func.GetBuffer());
	},
	
	/**
	 * Compiles, sends and adds to the stack.
	 * 
	 * @param {[type]}   func     [description]
	 * @param {Function} callback [description]
	 */
	_SendReturnFunction: function(func, callback)
	{
		func.Compile();
		this._rabbitHoleSock.write(func.GetPacket());
		this._stackReturnFunctions[func.GetPacketID()] = func;
	},
	
	/**
	* Determines what kind of packet is received and passes
	* the output on to the correct executor.
	* 
	* @param {Buffer} buffer - Full packet
	*/
	_AnalyzePacket: function(buffer)
	{
		// If it is an event packet
		if(buffer.readUInt8(0) === "E".charCodeAt(0))
		{
			// Parse the packet into an Event object
			var e = EventParser.Parse(buffer);
			
			// Determine how to execute the event within Alice
			if(e.GetName() === "INIT")
			{
				this._ServerInit();
			}
			else if(e.GetName() === "CHAT")
				this._ExecBoundFunctionsOnChat(this._players[parseInt(e.GetArg(0))], e.GetArg(2));
			else if(e.GetName() === "CHANGENAME")
				this._ExecBoundFunctionsOnNameChange(this._players[parseInt(e.GetArg(0))], e.GetArg(1));
			else if(e.GetName() === "STATUSREQ")
				this._ExecBoundFunctionsOnStatusReq(e.GetArg(0), e.GetArg(1));
			else if(e.GetName() === "JOINREQ")
			{
				var self = this;

				// Execute internal callback before executing the user defined ones
				this._OnJoinRequest(e.GetArg(0), e.GetArg(1), function(geoData)
				{
					self._ExecBoundFunctionsOnJoinReq(e.GetArg(0), e.GetArg(1), geoData);
				});
			}
			else if(e.GetName() === "JOIN")
			{
				var self = this;

				this._OnJoin(parseInt(e.GetArg(0)), e.GetArg(1), e.GetArg(2), e.GetArg(3), function()
				{
					self._ExecBoundFunctionsOnJoin(self._players[parseInt(e.GetArg(0))]);
				});
			}
			else if(e.GetName() === "DISCONNECT")
			{
				this._ExecBoundFunctionsOnDisconnect(this._players[parseInt(e.GetArg(0))]);

				// Execute internal event, mostly used to clean up player objects
				this._OnDisconnect(parseInt(e.GetArg(0)));
			}
		}
		else if(buffer.readUInt8(0) === "R".charCodeAt(0))
		{
			// Get the packet's ID so we can determine which callback to execute
			var packetID = buffer.readUInt32BE(5);
			
			// Parse and execute the callback that's associated with the packet ID
			returnFunction = this._stackReturnFunctions[packetID];
			returnFunction.Parse(buffer);
			returnFunction.ExecuteCallback();
		}
	},
	
	
	/* ============ BOUND FUNC EXECUTORS
	\* ========================================== */
	
	_ExecBoundFunctionsOnAliceInit: function()
	{
		var c = this._eventBindsOnAliceInit.length;
		for(var i = 0; i < c; i++)
		{
			this._eventBindsOnAliceInit[i]();
		}
	},
	_ExecBoundFunctionsOnJoinReq: function(ipAddress, geoData)
	{
		var c = this._eventBindsOnJoinReq.length;
		for(var i = 0; i < c; i++)
		{
			this._eventBindsOnJoinReq[i](ipAddress, geoData);
		}
	},
	_ExecBoundFunctionsOnJoin: function(player)
	{
		var c = this._eventBindsOnJoin.length;
		for(var i = 0; i < c; i++)
		{
			this._eventBindsOnJoin[i](player);
		}
	},
	_ExecBoundFunctionsOnDisconnect: function(player)
	{
		var c = this._eventBindsOnDisconnect.length;
		for(var i = 0; i < c; i++)
		{
			this._eventBindsOnDisconnect[i](player);
		}
	},
	_ExecBoundFunctionsOnChat: function(player, message)
	{
		var c = this._eventBindsOnChat.length;
		for(var i = 0; i < c; i++)
		{
			this._eventBindsOnChat[i](player, message);
		}
	},
	_ExecBoundFunctionsOnNameChange: function(player, newName)
	{
		var c = this._eventBindsOnNameChange.length;
		for(var i = 0; i < c; i++)
		{
			this._eventBindsOnNameChange[i](player, newName);
		}
	},
	_ExecBoundFunctionsOnStatusReq: function(playerID, newName)
	{
		var c = this._eventBindsOnStatusReq.length;
		for(var i = 0; i < c; i++)
		{
			this._eventBindsOnStatusReq[i]();
		}
	}

}

module.exports = Wonderland;