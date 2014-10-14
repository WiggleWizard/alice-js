var Moment = require('moment');

var Utils   = require('./Utils.js');
var Printer = require('./Printer.js');

var Commands = {

/***********************************************\
|* ADMIN COMMANDS
\***********************************************/

	Perm: function(player, argv, wonderland)
	{
		// Argv includes the actual command too
		var argc = argv.length - 1;

		// Player just typed !perm without args
		if(argc == 0)
		{
			player.RetrieveSigilLogin(function()
			{
				if(player.IsSignedIntoSigil())
				{
					player.Tell("^5You are logged in as ^2" + player.GetSigilUsername());
					player.Tell("^5Slot ID: ^2" + player.GetSlotID());
					player.Tell("^5Group: ^2" + player.GetSigilGroupName());
					player.Tell("^5Current IP: ^2" + player.GetIP());
				}
				else
				{
					player.Tell("^1You are not logged in to Sigil");
				}
			});
		}
		// Player used !perm [id / part name]
		else if(argc == 1)
		{
			// Player actually needs perms for this variation
			if(player.HasPerm("perm_target"))
			{
				var PrintUsage = function()
				{
					player.Tell("^1Usage: !perm [id / partial name]");
					player.Tell("^1-> Retrieves detailed data about the target.");
				}
				
				arg1 = argv[1].trim();

				// Arg guard
				if(arg1 === "")
				{
					PrintUsage();
					return;
				}
			
				var target = wonderland.FindPlayer(arg1, player);

				if(target !== null)
				{
					player.Tell("^6Slot ID: " + target.GetSlotID());
					player.Tell("^6Ingame Name: " + target.GetName());
					player.Tell("^6IP: " + target.GetIP());

					var geoData = target.GetGeoData();
					if(geoData.status === 'fail')
						player.Tell("^1No geo data available");
					else
					{
						player.Tell("^6Country: " + geoData.country + " [" + geoData.countryCode + "]");
					}
				}
			}
			else
			{
				player.Tell("^1You do not have permissions for that");
			}
		}
	},

	Kick: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !kick [id / partial name] [reason]");
			player.Tell("^1-> Kicks the player and shows the reason to him when kicked.");
		}
		
		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 2)
		{
			PrintUsage();
			return;
		}
		
		arg1 = argv[1].trim();
		arg2 = argv[2].trim();
		
		// Arg guard
		if(arg1 === "" || arg2 === "")
		{
			PrintUsage();
			return;
		}
		
		var target = wonderland.FindPlayer(arg1, player);

		if(target !== null)
		{
			wonderland.BroadcastChat("^5" + target.GetName() + " ^5was kicked, reason: " + arg2);
			target.Kick(arg2);
		}
	},

	Ban: function(player, argv, wonderland)
	{
		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 2)
		{
			player.Tell("^1Usage: !ban [id / partial name] [reason]");
			player.Tell("^1-> Bans the player and shows the reason to him when removed from the server.");
		}
		else
		{
			arg1 = argv[1].trim();
			arg2 = argv[2].trim();
			search = wonderland.FindPlayers(arg1);

			if(search != null)
			{
				if(search.length > 1)
					player.Tell("^1Multiple players found with that name, try refine your search");
				else
				{
					wonderland.BroadcastChat("^5" + search[0].GetName() + " ^1was banned, reason: " + arg2);
					search[0].Ban(player, arg2);
				}
			}
			else
			{
				player.Tell("^1No players found in the search, try using an ID or different your search terms");
			}
		}
	},

	TempBan: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !tb/tban [id / partial name] [time macro] [reason]");
			player.Tell("^1-> Temporarily bans the player and shows the reason to him when removed from the server.");
		}

		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 3)
		{
			PrintUsage();
		}
		else
		{
			arg1 = argv[1].trim();
			arg2 = argv[2].trim();
			arg3 = argv[3].trim();
			
			// Arg guard
			if(arg1 === "" || arg2 === "" || arg3 === "")
			{
				PrintUsage();
				return;
			}
			
			var target = wonderland.FindPlayer(arg1, player);

			if(target !== null)
			{
				var unbanMoment = Utils.AddMacroToMoment(Moment(), arg2);
				wonderland.BroadcastChat("^5" + target.GetName() + " ^1was temp banned for " + unbanMoment.fromNow(true) + ", reason: " + arg3);
				target.TempBan(player, arg2, arg3);
			}
		}
	},

	Warn: function(player, argv, wonderland)
	{
		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 2)
		{
			player.Tell("^1Usage: !warn/w [id / partial name] [reason]");
			player.Tell("^1-> Warns the player with a reason, player is kicked/tempbanned/banned after x amount of warnings.");
		}
		else
		{
			arg1   = argv[1].trim();
			arg2   = argv[2].trim();
			search = wonderland.FindPlayers(arg1);

			if(search != null)
			{
				if(search.length > 1)
					player.Tell("^1Multiple players found with that name, try refine your search");
				else
				{
					// Static vars for now, will make them dynamic later
					var warnsTillKick = 3;
					var warnsTillTBan = 6;
					var warnsTillPBan = 9;

					// Get the player's warnings and react according to how many he has
					search[0].Warn(player, arg2, 30, function(warnCount, lastWarnTime)
					{
						// Last warn time will be 0 if warn was issued 
						if(lastWarnTime === 0)
						{
							wonderland.BroadcastChat(search[0].GetName() + " was warned for: " + arg2);

							if(warnCount === 3)
							{
								search[0].Kick("Too many warnings");
							}
							else if(warnCount === warnsTillTBan)
							{}
							else if(warnCount === warnsTillPBan)
							{
								player.Ban(player, "Too many warnings");
							}
						}
						else
						{
							player.Tell("You cannot warn this player for another " + lastWarnTime + " seconds");
						}
					});
				}
			}
			else
			{
				player.Tell("^1No players found in the search, try using an ID or different your search terms");
			}
		}
	},

	Geo: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !geo [id / partial name]");
			player.Tell("^1-> Shows more geological data.");
		}
		
		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 1)
		{
			PrintUsage();
			return;
		}

		arg1 = argv[1].trim();
		
		// Arg guard
		if(arg1 === "")
		{
			PrintUsage();
			return;
		}
		
		var target = wonderland.FindPlayer(arg1, player);
		
		if(target !== null)
		{
			var geoData = target.GetGeoData();

			if(geoData.status !== 'fail')
			{
				player.Tell("^2IP: ^7" + target.GetIP());
				player.Tell("^2Country: ^7" + geoData.country + "[" + geoData.countryCode + "]");
				if(geoData.city !== "")
					player.Tell("^2City: ^7" + geoData.city);
				player.Tell("^2Approx. Long/Lat: ^7" + geoData.lon + "deg/" + geoData.lat + "deg");
				player.Tell("^2ISP: ^7" + geoData.isp);
			}
			else
				player.Tell("^1Geolocational data unavailable for this player, reason: " + geoData.message);
		}
	},

	PlayerList: function(player, argv, wonderland)
	{
		// Lists the array of users it's handed
		var ListUsers = function(playerArray)
		{
			var s = playerArray.length;
			for(var i = 0; i < s; i++)
			{
				if(playerArray[i].IsConnected())
					player.Tell("^5[" + playerArray[i].GetSlotID() + "] ^7" +
								playerArray[i].GetName() +
								" ^5[" + playerArray[i].GetIP() + "]");
			}
		}

		// Argv includes the actual command too
		var argc = argv.length - 1;

		// If no params then print every player
		if(argc === 0)
		{
			ListUsers(wonderland._players);
			player.Tell("^3To view the entire list use Shift + `");
		}
		else if(argc === 1)
		{
			// Page arg
			
		}
	},
	
	MutePlayer: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !mute [id / partial name]");
			player.Tell("^1-> Mutes a player so his chat is never shown to other players.");
		}
		
		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 1)
		{
			PrintUsage();
			return;
		}
		
		arg1 = argv[1].trim();
		
		// Arg guard
		if(arg1 === "")
		{
			PrintUsage();
			return;
		}
		
		var target = wonderland.FindPlayer(arg1, player);
		
		if(target !== null)
		{
			target.Mute();
			target.Tell("^1You were muted");
			player.Tell("^2" + target.GetName() + " was muted");
		}
	},


/***********************************************\
|* FUN COMMANDS
\***********************************************/

	Ping: function(player, argv, wonderland)
	{
		wonderland.BroadcastChat("Alice: Pong");
	},

	Pizza: function(player, argv, wonderland)
	{
		argc = argv.length;

		if(argc != 2)
		{
			wonderland.BroadcastChat(player.GetName() + " has started eating a pizza");
		}
		else
		{
			arg1 = argv[1].trim();

			if(arg1 === "")
			{
				player.Tell("^1Usage: !pizza [partial name]");
				player.Tell("^1-> Sends a pizza to someone.");
			}
			else
			{
				search = wonderland.FindPlayersByPartName(arg1);

				if(search != null)
				{
					if(search.length > 1)
						player.Tell("^1Multiple players found with that name, try refine your search");
					else
						wonderland.BroadcastChat(player.GetName() + " sent a pizza to " + search[0].GetName());
				}
			}
		}
	}

}
module.exports = Commands;