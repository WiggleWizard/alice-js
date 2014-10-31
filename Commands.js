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
					player.Tell("^2You are logged in as ^5" + player.GetSigilUsername());
					player.Tell("^2Slot ID: ^5" + player.GetSlotID());
					player.Tell("^2Group: ^5" + player.GetSigilGroupName());
					player.Tell("^2Current IP: ^5" + player.GetIP());
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
					if(target.IsSignedIntoSigil())
						player.Tell('^2Logged in as ' + target.GetSigilUsername() + ' [' + target.GetSigilGroupName() + ']');

					player.Tell("^2Slot ID: ^3" + target.GetSlotID());
					player.Tell("^2Ingame Name: ^3" + target.GetCleanName());
					player.Tell("^2IP: ^3" + target.GetIP());
					player.Tell('^2GUID: ^3' + target.GetGUID().substring(0, 12));

					var geoData = target.GetGeoData();
					if(geoData.status === 'fail')
						player.Tell("^1No geo data available");
					else
					{
						player.Tell("^2Country: ^3" + geoData.country + " [" + geoData.countryCode + "]");
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
			if(target.GetSigilGroupRank() >= player.GetSigilGroupRank())
			{
				player.Tell("^1You cannot kick " + target.GetCleanName() + ", they are a higher rank than you.");
				return;
			}

			wonderland.BroadcastChat("^5" + target.GetCleanName() + " ^5was kicked, reason: " + arg2);
			target.Kick(arg2);
		}
	},

	Name: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !name [id / partial name] [new name]");
			player.Tell("^1-> Renames a player.");
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
			if(target.GetSigilGroupRank() >= player.GetSigilGroupRank())
			{
				player.Tell("^1You cannot change " + target.GetCleanName() + "'s name, they are a higher rank than you.");
				return;
			}

			wonderland.BroadcastChat("^5" + target.GetCleanName() + " ^5was kicked, reason: " + arg2);
			target.Kick(arg2);
		}
	},

	Ban: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !ban [id / partial name] [reason]");
			player.Tell("^1-> Bans the player and shows the reason to him when removed from the server.");
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
			// Rank guard
			if(target.GetSigilGroupRank() >= player.GetSigilGroupRank())
			{
				player.Tell("^1You cannot perma ban " + target.GetCleanName() + ", they are a higher rank than you.");
				return;
			}

			wonderland.BroadcastChat("^5" + search[0].GetCleanName() + " ^1was banned, reason: " + arg2);
			search[0].Ban(player, arg2);
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
				if(target.GetSigilGroupRank() >= player.GetSigilGroupRank())
				{
					player.Tell("^1You cannot temp ban " + target.GetCleanName() + ", they are a higher rank than you.");
					return;
				}

				var unbanMoment = Utils.AddMacroToMoment(Moment(), arg2);
				wonderland.BroadcastChat("^5" + target.GetCleanName() + " ^1was temp banned for " + unbanMoment.fromNow(true) + ", reason: " + arg3);
				target.TempBan(player, arg2, arg3);
			}
		}
	},

	Warn: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !warn/w [id / partial name] [reason]");
			player.Tell("^1-> Warns the player with a reason, player is kicked/tempbanned/banned after x amount of warnings.");
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
			// Static vars for now, will make them dynamic later
			var warnsTillKick = 3;
			var warnsTillTBan = 6;
			var warnsTillPBan = 9;

			if(target.GetSigilGroupRank() >= player.GetSigilGroupRank())
			{
				player.Tell("^1You cannot warn " + target.GetCleanName() + ", they are a higher rank than you.");
				return;
			}

			// Get the player's warnings and react according to how many he has
			target.Warn(player, arg2, 30, function(warnCount, lastWarnTime)
			{
				// Last warn time will be 0 if warn was issued 
				if(lastWarnTime === 0)
				{
					wonderland.BroadcastChat(target.GetCleanName() + " was warned for: " + arg2);

					if(warnCount === 3)
					{
						target.Kick("Too many warnings");
					}
					else if(warnCount === warnsTillTBan)
					{
						target.TempBan(player, '2h', 'Too many warnings');
					}
					else if(warnCount === warnsTillPBan)
					{
						target.Ban(player, "Too many warnings");
					}
				}
				else
				{
					player.Tell("^3You cannot warn this player for another " + lastWarnTime + " seconds");
				}
			});
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
		// Argv includes the actual command too
		var argc = argv.length - 1;

		// If no params then print every player
		if(argc === 0)
		{
			Printer.ListPlayersFor(player, wonderland._players);
			player.Tell("^3To view the entire list use Shift + `");
		}
		else if(argc === 1)
		{
			var playersPerPage = 5;

			// Page arg
			var page = Utils.ToInt(argv[1]);

			if(page === null)
			{
				player.Tell('^1A number is required for page');
				return;
			}

			// Gotta collate all online players into one array
			var onlinePlayers = new Array();
			var s = wonderland._players.length;
			for(var i = 0; i < s; i++)
			{
				if(wonderland._players[i].IsConnected())
					onlinePlayers.push(wonderland._players[i]);
			}

			// Now we figure out what range to begin printing from
			var rangeBegin = (page - 1) * playersPerPage;
			
			// Clamp lower range
			if(rangeBegin < 0)
				rangeBegin = 0;

			// Construct a small array of all players to be listed
			var playerList = new Array();
			for(var i = rangeBegin; i < playersPerPage; i++)
			{
				if(i >= onlinePlayers.length) break;

				playerList.push(onlinePlayers[i]);
			}

			Printer.ListPlayersFor(player, playerList);
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
			if(target.GetSigilGroupRank() >= player.GetSigilGroupRank())
			{
				player.Tell("^1You cannot mute " + target.GetCleanName() + ", they are a higher rank than you.");
				return;
			}

			target.Mute();
			target.Tell("^1You were muted");
			player.Tell("^2" + target.GetCleanName() + " was muted");
		}
	},

	UnmutePlayer: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !unmute [id / partial name]");
			player.Tell("^1-> Unmutes a muted player.");
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
			if(target.IsMuted())
			{
				target.Unmute();
				target.Tell("^1You were unmuted");
				player.Tell("^2" + target.GetCleanName() + " was unmuted");
			}
			else
			{
				player.Tell('^1Player is not muted');
			}
		}
	},

	Map: function(player, argv, wonderland)
	{
		var PrintUsage = function()
		{
			player.Tell("^1Usage: !map [map name] <gametype>");
			player.Tell("^1-> Changes the map. Use !maps or !gametypes to see a list of maps or gametypes.");
		}
		
		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 1)
		{
			PrintUsage();
			return;
		}
		
		var arg1 = argv[1].trim();
		var arg2 = '';

		if(argc > 1)
			arg2 = argv[2].trim(); // Optional
		
		// Arg guard
		if(arg1 === "")
		{
			PrintUsage();
			return;
		}

		// We need to set the gametype before we change the map
		if(arg2 !== '')
		{
			var gametypeName = Utils.GetGametypeMachineName(arg2);

			if(gametypeName === null)
			{
				player.Tell('^1No such gametype was found, try !gametypes for a list of usable gametypes.');
				return;
			}
			else
			{
				wonderland.ExecuteCommand('g_gametype ' + gametypeName);
			}
		}

		// Pick out the machine name from the human name
		var machineMapName = Utils.GetMapMachineName(arg1);

		if(machineMapName === null)
			player.Tell('^1Map not found, try !maps for a list of usable maps to play.');
		else
		{
			wonderland.ExecuteCommand('map ' + machineMapName);
		}
	},

	Maps: function(player, argv, wonderland)
	{
		player.Tell('^2Available maps:');

		// Compile a list of maps into one
		var out = "^2- ";
		var s   = Utils.mapFriendlyNames.length;
		for(var i = 0; i < s;)
		{
			var pg = i + 5;
			if(pg > s) pg = s; // Clampy clamp
			for(var j = i; j < pg; j++)
			{
				out += Utils.mapFriendlyNames[i] + ', ';
				i++;
			}
			
			player.Tell(out);
			out = '^2';
		}
	},

	Gametypes: function(player, argv, wonderland)
	{
		player.Tell('^2Available gametypes:');

		// Compile a list of maps into one
		var out = "^2- ";
		var s   = Utils.gametypesFriendlyNames.length;
		for(var i = 0; i < s;)
		{
			var pg = i + 5;
			if(pg > s) pg = s;
			for(var j = i; j < pg; j++)
			{
				out += Utils.gametypesFriendlyNames[i] + ', ';
				i++;
			}
			
			player.Tell(out);
			out = '^2';
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
			wonderland.BroadcastChat(player.GetCleanName() + " has started eating a pizza");
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
						wonderland.BroadcastChat(player.GetCleanName() + " sent a pizza to " + search[0].GetCleanName());
				}
			}
		}
	},


/***********************************************\
|* ALL PLAYER COMMANDS
\***********************************************/

	Version: function(player, argv, wonderland)
	{
		player.Tell(Utils.color.lightblue + 'Current running Alice ' + wonderland._version);
	}

}
module.exports = Commands;