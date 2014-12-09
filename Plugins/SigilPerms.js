var PHPUnserialize = require('php-unserialize');

var Plugin = function()
{
	this._fname   = "Sigil Permissions"
	this._desc    = "Utilizes Sigil to give permissions to players and extends the Player object";
	this._name    = "SigilPerms";
	this._version = "1.0";
	this._enabled = true;
	this._deps    = "SigilDatabase";
}

Plugin.prototype = {

	OnPluginInit: function()
	{
		Player.prototype._loggedIn  = false;
		Player.prototype._perms     = new Array();
		Player.prototype._userID    = null;
		Player.prototype._userName  = null;
		Player.prototype._groupName = null;
		Player.prototype._groupRank = 0;

		Player.prototype.HasPerm = function()
		{
			var s = this._perms.length;
			for(var i = 0; i < s; i++)
			{
				if(this._perms[i] === perm)
					return true;
			}

			return false;
		}

		/**
		 * Different from RetrieveSigilDetails(), this does a check to see if the
		 * user is logged in, once that check passes then it calls
		 * RetrieveSigilDetails() to make sure that details of the log in are stored
		 * correctly in the user object.
		 * 
		 * @param {Function} callback [description]
		 */
		Player.prototype.RetrieveSigilLogin = function(callback)
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
			Database.query(sql, [this._ipAddr], function(err, results)
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
		}

		/**
		 * Doesn't check to make sure that the user ID exists or any
		 * check for that matter.
		 * 
		 * @param {[type]}   userID   [description]
		 * @param {Function} callback [description]
		 */
		Player.prototype.RetrieveSigilDetails = function(userID, callback)
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
		}
	}
}

module.exports = Plugin;