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
				arg1 = argv[1].trim();

				if(arg1 === "")
				{
					player.Tell("^1Usage: !perm [id / partial name]");
					player.Tell("^1-> Retrieves detailed data about the target.");
				}
				else
				{
					search = wonderland.FindPlayers(arg1);

					if(search != null)
					{
						if(search.length > 1)
							player.Tell("^1Multiple players found with that name, try refine your search");
						else
						{
							player.Tell("^6Slot ID: " + search[0].GetSlotID());
							player.Tell("^6Ingame Name: " + search[0].GetName());
							player.Tell("^6IP: " + search[0].GetIP());

							var geoData = search[0].GetGeoData();
							if(geoData.status === 'fail')
								player.Tell("^1No geo data available");
							else
							{
								player.Tell("^6Country: " + geoData.country + "[" + geoData.countryCode + "]");
								player.Tell("^5To get more geographical information, use !geo [id / partial name]");
							}
						}
					}
					else
					{
						player.Tell("^1No players found in the search, try using an ID or different your search terms");
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
		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 2)
		{
			player.Tell("^1Usage: !kick [id / partial name] [reason]");
			player.Tell("^1-> Kicks the player and shows the reason to him when kicked.");
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
					wonderland.BroadcastChat("^5" + search[0].GetName() + " ^5was kicked, reason: " + arg2);
					var kickMsg = 	"^5= You have been kicked =\n" +
									"^5/----------------------------------------------------------------\\\n" +
									"^7Reason for kick: \n^5" + argv[2] + "\n"+
									"^5\\----------------------------------------------------------------/";
					search[0].Kick(kickMsg);
				}
			}
			else
			{
				player.Tell("^1No players found in the search, try using an ID or different your search terms");
			}
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

	Geo: function(player, argv, wonderland)
	{
		// Argv includes the actual command too
		var argc = argv.length - 1;

		if(argc < 1)
		{
			player.Tell("^1Usage: !geo [id / partial name]");
			player.Tell("^1-> Shows more geological data.");
		}
		else
		{
			arg1 = argv[1].trim();
			search = wonderland.FindPlayers(arg1);

			if(search != null)
			{
				if(search.length > 1)
					player.Tell("^1Multiple players found with that name, try refine your search");
				else
				{
					var geoData = search[0].GetGeoData();

					if(geoData.status !== 'fail')
					{
						player.Tell("^2IP: ^7" + search[0].GetIP());
						player.Tell("^2Country: ^7" + geoData.country + "[" + geoData.countryCode + "]");
						if(geoData.city !== "")
							player.Tell("^2City: ^7" + geoData.city);
						player.Tell("^2Approx. Long/Lat: ^7" + geoData.lon + "deg/" + geoData.lat + "deg");
						player.Tell("^2ISP: ^7" + geoData.isp);
					}
					else
						player.Tell("^1Geolocational data unavailable for this player, reason: " + geoData.message);
				}
			}
			else
			{
				player.Tell("^1No players found in the search, try using an ID or different your search terms");
			}
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
				search = wonderland.FindPlayerIDsByPartName(arg1);

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