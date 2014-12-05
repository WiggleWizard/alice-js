var PHPUnserialize = require('php-unserialize');
var Moment         = require('moment');

/* User Objects */
var VoidFunction   = require('./VoidFunction.js');
var ReturnFunction = require('./ReturnFunction.js');
var Utils          = require('./Utils.js');
var Printer        = require('./Printer.js');

function Player(wonderland)
{
	// Holds a fully initialized Wonderland
	this._wonderland = wonderland;
	this._dbConn     = wonderland._dbConn;

	this._connected = false;

	// General (Every player should have this crap)
	this._slotID    = null;
	this._ipAddr    = "";
	this._guid      = "";
	this._name      = "";
	this._cleanName = "";
	this._geoData   = {};

	// Sigil related stuff
	this._isSignedIntoSigil = false;
	this._perms             = new Array();
	this._sigilUsername     = "";
	this._sigilGroupName    = "";
	this._sigilGroupRank    = 0;

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

		this._slotID    = slotID;
		this._ipAddr    = ipAddress;
		this._guid      = guid;
		this._name      = name;
		this._cleanName = Utils.StripColor(name);
		this._geoData   = geoData;

		// Sigil related stuff
		this._isSignedIntoSigil = false;
		this._perms             = new Array();
		this._sigilUserID       = null;
		this._sigilUsername     = "";
		this._sigilGroupName    = "";
		this._sigilGroupRank    = 0;

		// Additional optional data
		this._muted       = false;
		this._nameChanged = 0; // Amount of times the player has change his name

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
		var sql  = 'SELECT             \
						last_activity, \
						user_data      \
					FROM               \
						sessions       \
					WHERE              \
						ip_address=?   \
					ORDER BY last_activity DESC';
		this._dbConn.query(sql, [this._ipAddr], function(err, results)
		{
			// Select the latest session from the database
			var latestResult = results[0];

			// Ensure that this user has/is logged in
			if(results.length > 0 && latestResult.user_data !== '')
			{
				// Ensure that their last activity was at least less than 2 hours ago
				var currentTime = Math.round(Date.now() / 1000);
				if(parseInt(latestResult.last_activity) > currentTime - 7200)
				{
					// Unserialize the PHP serial into JSON (We only really need their user ID)
					var userData = PHPUnserialize.unserialize(latestResult.user_data);

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

		sql  = 'SELECT                                                  \
					accounts.id AS user_id,                             \
					accounts.username AS username,                      \
					accounts.ingame_name AS ingame_name,                \
					                                                    \
					`groups`.name AS group_name,                        \
					`groups`.rank AS group_rank,                        \
					                                                    \
					perm_keys.key AS perm_key                           \
				FROM                                                    \
					accounts                                            \
				LEFT JOIN                                               \
					account_groups ON (account_id=accounts.id)          \
				LEFT JOIN                                               \
					`groups` ON (account_groups.group_id=`groups`.id)   \
				LEFT JOIN                                               \
					alice_perms ON (`group`=account_groups.group_id)    \
				LEFT JOIN                                               \
					perm_keys ON (perm_keys.id=alice_perms.perm_key_id) \
				WHERE accounts.id=?';
		self._dbConn.query(sql, [userID], function(err, results)
		{
			if(results.length > 0)
			{
				self._isSignedIntoSigil = true;

				// Assign the user id, username and group name/rank first
				self._sigilUserID    = results[0].user_id;
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
		this._cleanName = Utils.StripColor(name);

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

		Alice._SendVoidFunction(voidFunc);
	},

	/**
	 * Kicks a player from the server and shows him the message.
	 * 
	 * @param {[type]} message [description]
	 */
	Kick: function(message)
	{
		var kickMsg = Printer.GenerateNotice(
			Utils.color.lightblue,
			'You have been kicked',
			'^7Reason for kick: \n' + Utils.color.lightblue + message,
			Utils.color.lightblue
		);

		var argv = [this._slotID, kickMsg];
		var argt = [1, 3];
		
		var voidFunc = new VoidFunction("KICKPLAYER", argv, argt);

		this._wonderland._SendVoidFunction(voidFunc);
	},

	KickCustom: function(message)
	{
		var argv = [this._slotID, message];
		var argt = [1, 3];
		
		var voidFunc = new VoidFunction("KICKPLAYER", argv, argt);

		this._wonderland._SendVoidFunction(voidFunc);
	},

	/**
	 * Bans a player, and records the ban in Sigil database.
	 * 
	 * @param {Player} admin  - The player that is banning the user.
	 * @param {String} reason - Reason will be recorded and shown to the player.
	 */
	Ban: function(admin, reason)
	{
		var self = this;
		
		// Get the current server time in MySQL datetime format
		var currentTimeInSQL = Moment().format('YYYY-MM-DD HH:mm:ss');

		var sql =  "INSERT INTO             \
						bans (              \
							player_name,    \
							player_ip,      \
							player_guid,    \
							admin_ign,      \
							admin_sigil_id, \
							admin_ip,       \
							reason,         \
							timestamp,      \
							type            \
						) VALUES (          \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							1               \
						)";
		var preparedParams = [
			this._name,
			this._ipAddr,
			this._guid,
			admin.GetName(),
			admin.GetSigilUserID(),
			admin.GetIP(),
			reason,
			currentTimeInSQL
		]
		this._dbConn.query(sql, preparedParams, function(err, result)
		{
			var kickMsg = Printer.GenerateNotice(
				Utils.color.red,
				'You have been banned',
				'^7Your ban ID is ^1' + result.insertId + '^7\n' +
				'You were banned for: \n^1' + reason,
				Utils.color.red
			);

			// Kick the user showing the ban reason
			self.KickCustom(kickMsg);
		});
	},

	TempBan: function(admin, macro, reason)
	{
		var self = this;
		
		// Get the current server time in MySQL datetime format
		var currentTimeInSQL   = Moment().format('YYYY-MM-DD HH:mm:ss');
		var unbanMoment        = Utils.AddMacroToMoment(Moment(), macro);
		var unbanDatetimeInSQL = unbanMoment.format('YYYY-MM-DD HH:mm:ss');

		var sql =  "INSERT INTO             \
						bans (              \
							player_name,    \
							player_ip,      \
							player_guid,    \
							admin_ign,      \
							admin_sigil_id, \
							admin_ip,       \
							reason,         \
							timestamp,      \
							unban_datetime, \
							type            \
						) VALUES (          \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							2               \
						)";
		var preparedParams = [
			this._name,
			this._ipAddr,
			this._guid,
			admin.GetName(),
			admin.GetSigilUserID(),
			admin.GetIP(),
			reason,
			currentTimeInSQL,
			unbanDatetimeInSQL
		]
		this._dbConn.query(sql, preparedParams, function(err, result)
		{
			// Kick the user showing the ban reason
			self.KickCustom(
				"^1= You have been temporarily banned for " + unbanMoment.fromNow(true) + " =\n" +
				"^1/----------------------------------------------------------------\\\n" +
				"^7Your ban ID is ^1" + result.insertId + "^7\n" +
				"You were banned for: \n^1" + reason + "\n"+
				"^1\\----------------------------------------------------------------/");
		});
	},

	/**
	 * Records the warn, warn counts are based on player name.
	 * 
	 * @param {Function} callback(warnCount, lastWarnTime)
	 */
	GetWarnings: function(callback)
	{
		// Get the player's total warnings and react based on that
		var sql =  'SELECT                     \
						time AS datetime       \
					FROM                       \
						warnings               \
					WHERE                      \
						player_name=?          \
					ORDER BY id DESC';
		this._dbConn.query(sql, [this.GetName()], function(err, results)
		{
			console.log();
			if(results.length > 0)
				callback(results.length, results[0].datetime);
			else
				callback(0, 0);
		});
	},

	/**
	 * Simply logs the warn if applicable.
	 * 
	 * @param {String}   reason
	 * @param {Number}   waitTime - Amount in seconds before the same player can
	 *                              be warned again.
	 * @param {Function} callback(warnCount, lastWarnTime)
	 *                   warnCount is the amount of warns AFTER the warn is issued if successful.
	 *                   lastWarnTime is > 0 if the warn was not issued.
	 */
	Warn: function(admin, reason, waitTime, callback)
	{
		var self = this;

		this.GetWarnings(function(warnCount, lastWarnTime)
		{
			// Not the player's first warning
			if(warnCount > 0)
			{
				// If the last warning occured more than "waitTime" seconds ago then continue
				var lastWarn = Moment(lastWarnTime);
				var lastWarnDiff = Moment().diff(lastWarn, 'seconds');

				if(lastWarnDiff > waitTime)
				{
					self.LogWarn(admin, reason);
					callback(++warnCount, 0);
				}
				else
				{
					callback(warnCount, (waitTime - lastWarnDiff));
				}
			}
			else
			{
				self.LogWarn(admin, reason);
				callback(1, 0);
			}
		});
	},

	/**
	 * No callback required as this should be a simple log, nothing actionable.
	 * 
	 * @param {Player} admin  - The admin who is issueing the warn.
	 * @param {String} reason - Reason for the warn.
	 */
	LogWarn: function(admin, reason)
	{
		// Asyncronous log
		var sql =  "INSERT INTO             \
						warnings (          \
							player_name,    \
							player_ip,      \
							player_guid,    \
							admin_ign,      \
							admin_sigil_id, \
							admin_ip,       \
							reason,         \
							time            \
						) VALUES (          \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?,              \
							?               \
						)";
		// Get the current server time in MySQL datetime format
		var currentTimeInSQL = Moment().format('YYYY-MM-DD HH:mm:ss');
		var sqlParams = [
			this._name,
			this._ipAddr,
			this._guid,
			admin.GetName(),
			admin.GetSigilUserID(),
			admin.GetIP(),
			reason,
			currentTimeInSQL
		]
		this._dbConn.query(sql, sqlParams, function(err, results) {});
	},

	GetIP: function()
	{
		return this._ipAddr;
	},
	GetName: function()
	{
		return this._name;
	},
	GetCleanName: function()
	{
		return this._cleanName;
	},
	GetSlotID: function()
	{
		return this._slotID;
	},
	GetGUID: function()
	{
		return this._guid;
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
	GetSigilUserID: function()
	{
		return this._sigilUserID;
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