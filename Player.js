var PHPUnserialize = require('php-unserialize');

/* User Objects */
var VoidFunction   = require('./VoidFunction.js');
var ReturnFunction = require('./ReturnFunction.js');

function Player(wonderland)
{
	// Holds a fully initialized Wonderland
	this._wonderland = wonderland;
	this._dbConn     = wonderland._dbConn;

	this._connected = false;

	// General (Every player should have this crap)
	this._slotID  = null;
	this._ipAddr  = "";
	this._guid    = "";
	this._name    = "";
	this._geoData = {};

	// Sigil related stuff
	this._isSignedIntoSigil = false;
	this._perms             = new Array();
	this._sigilUsername     = "";
	this._sigilGroupName    = "";
	this._sigilGroupRank    = 0;

	// Additional optional data
	this._muted       = false;
	this._nameChanged = 0; // Amount of times the player has change his name
}

Player.prototype = {

	/**
	 * Callback is called once the player has been properly initialized.
	 * 
	 * @param {Number}   slotID    [description]
	 * @param {String}   ipAddress [description]
	 * @param {String}   guid      [description]
	 * @param {String}   name      [description]
	 * @param {GeoIP}    geoData   [description]
	 * @param {Function} callback  [description]
	 */
	Initialize: function(slotID, ipAddress, guid, name, geoData, callback)
	{
		var self = this;

		this._connected = true;

		this._slotID  = slotID;
		this._ipAddr  = ipAddress;
		this._guid    = guid;
		this._name    = name;
		this._geoData = geoData;

		// Sets object properties
		this.RetrieveSigilLogin(callback);
	},

	/**
	 * Different from RetrieveSigilDetails(), this does a check to see if the
	 * user is logged in, once that check passes then it calls
	 * RetrieveSigilDetails() to make sure that details of the log in are stored
	 * correctly in the user object.
	 * 
	 * @param {Function} callback [description]
	 */
	RetrieveSigilLogin: function(callback)
	{
		var self = this;

		// Search the sessions table to find out if the IP is logged in or not
		var sql  = 'SELECT \
						last_activity, \
						user_data \
					FROM \
						sessions \
					WHERE \
						ip_address=?';
		this._dbConn.query(sql, [this._ipAddr], function(err, results)
		{
			// Ensure that this user has/is logged in
			if(results.length > 0 && results[0].user_data !== '')
			{
				// Ensure that their last activity was at least less than 2 hours ago
				var currentTime = Math.round(Date.now() / 1000);
				if(parseInt(results[0].last_activity) > currentTime - 7200)
				{
					// Unserialize the PHP serial into JSON (We only really need their user ID)
					var userData = PHPUnserialize.unserialize(results[0].user_data);

					// userID would be 0 if no credible data was found
					var userID = parseInt(userData.account_id);
					if(userID > 0)
					{
						self.RetrieveSigilDetails(userID, callback);
					}
					// The user has never actually logged in
					else
					{
						callback();
					}
				}
				// If the user has a profile, but activity was over 2 hours ago
				else
				{
					callback();
				}
			}
			// No IP matches in the sessions table
			else
			{
				callback();
			}
		});
	},

	/**
	 * Doesn't check to make sure that the user ID exists or any
	 * check for that matter.
	 * 
	 * @param {[type]}   userID   [description]
	 * @param {Function} callback [description]
	 */
	RetrieveSigilDetails: function(userID, callback)
	{
		var self = this;

		sql  = 'SELECT \
					accounts.id AS user_id, \
					accounts.username AS username, \
					accounts.ingame_name AS ingame_name, \
					\
					`groups`.name AS group_name, \
					`groups`.rank AS group_rank, \
					\
					perm_keys.key AS perm_key\
				FROM \
					accounts \
				LEFT JOIN \
					account_groups ON (account_id=accounts.id) \
				LEFT JOIN \
					`groups` ON (account_groups.group_id=`groups`.id) \
				LEFT JOIN \
					alice_perms ON (`group`=account_groups.group_id) \
				LEFT JOIN \
					perm_keys ON (perm_keys.id=alice_perms.perm_key_id) \
				WHERE accounts.id=?';
		self._dbConn.query(sql, [userID], function(err, results)
		{
			if(results.length > 0)
			{
				self._isSignedIntoSigil = true;

				// Assign the username and group name/rank first
				self._sigilUsername  = results[0].username;
				self._sigilGroupName = results[0].group_name;
				self._sigilGroupRank = parseInt(results[0].group_rank);
				self._perms          = []; // Resets the perms array

				// Now we retrieve all the perm keys for Alice
				var s = results.length;
				for(var i = 0; i < s; i++)
				{
					self._perms.push(results[i].perm_key);
				}
			}

			callback();
		});
	},

	SetName: function(name)
	{
		// Set player object name
		this._name = name;

		// Set a name change function to Wonderland
		var argv = [this._slotID, this._name];
		var argt = [1, 3];
		
		var voidFunc = new VoidFunction("SETPLAYERNAME", argv, argt);

		this._wonderland._SendVoidFunction(voidFunc);

		// Increase the number of name changes the player has done
		this._nameChanged++;
	},

	HasPerm: function(perm)
	{
		var s = this._perms.length;
		for(var i = 0; i < s; i++)
		{
			if(this._perms[i] === perm)
				return true;
		}

		return false;
	},

	Tell: function(message)
	{
		var argv = [this._slotID, message];
		var argt = [1, 3];
		
		var voidFunc = new VoidFunction("TELL", argv, argt);

		this._wonderland._SendVoidFunction(voidFunc);
	},

	/**
	 * Kicks a player from the server and shows him the message.
	 * 
	 * @param {[type]} message [description]
	 */
	Kick: function(message)
	{
		var argv = [this._slotID, message];
		var argt = [1, 3];
		
		var voidFunc = new VoidFunction("KICKPLAYER", argv, argt);

		this._wonderland._SendVoidFunction(voidFunc);
	},

	GetIP: function()
	{
		return this._ipAddr;
	},
	GetName: function()
	{
		return this._name;
	},
	GetSlotID: function()
	{
		return this._slotID;
	},
	GetGeoData: function()
	{
		return this._geoData;
	},
	GetTimesChangedName: function()
	{
		return this._nameChanged;
	},


	GetPerms: function()
	{
		return this._perms;
	},
	GetSigilUsername: function()
	{
		return this._sigilUsername;
	},
	GetSigilGroupName: function()
	{
		return this._sigilGroupName;
	},
	GetSigilGroupRank: function()
	{
		return this._sigilGroupRank;
	},
	IsConnected: function()
	{
		return this._connected;
	},
	IsSignedIntoSigil: function()
	{
		return this._isSignedIntoSigil;
	}
}

module.exports = Player;