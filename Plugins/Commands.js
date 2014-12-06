// var Bang = require('./Bang.js');       // In-game command handler

var Plugin = function()
{
	this._fname   = "Commands"
	this._desc    = "Ability to run commands";
	this._name    = "Commands";
	this._version = "1.0";
	this._enabled = true;

	this._commands = new Array();
}

Plugin.prototype = {
	OnPluginInit: function()
	{
		this.LoadCommands();
	},

	/**
	 * Reads all the JS files from Commands directory as objects.
	 */
	LoadCommands: function()
	{
		this.Logger.LogInfo('Loading commands to memory');

		// Get list of files in the dir
		var fs = require('fs');
		var files = fs.readdirSync(__dirname + '/Commands');

		var c = files.length;
		for(var i = 0; i < c; i++)
		{
			// Since it's already instanced in the module's export we can refer to
			// it directly.
			var command = require('./Commands/' + files[i]);
			this._commands.push(command);

			this.Logger.LogInfo('Loading ' + command._command);
		}
	},

	OnPlayerChat: function(player, message)
	{
		var cmdResult = this.ExecuteMessage(player, message);

		// If it was not a command then allow propagation
		if(cmdResult === 0)
			return message;
		// No such command
		else if(cmdResult === 2)
			player.Tell("^1No such command");
		// No permissions for command
		else if(cmdResult === 4)
			player.Tell("^1You do not have permissions for that");

		return false;
	},

	ExecuteMessage: function(player, message)
	{
		var Utils = require('../System/Utils');

		// Check if there's a descriptor at the beginning of the message
		if(message.charAt(0) === "!" && message !== "!")
		{
			// Store the result of the search
			cmdFound = false;
 
			// Extract the input command string
			// Eg: if the input was: "!me test"
			// then storage would look like this: "me", this also works for
			// input that has no parameters
			var inputCmd;
			if(message.indexOf(' ') > 0)
				inputCmd = message.substr(1, message.indexOf(' ') - 1);
			else
				inputCmd = message.substr(1);

			// Loop through all the loaded commands
			var c = this._commands.length;
			for(var i = 0; i < c; i++)
			{
				var cmd = this._commands[i];

				if(inputCmd === cmd._command)
				{
					cmdFound = true;
 
					if(typeof cmd.Execute === 'function')
					{
						// Split the message up by spaces and exec the command
						inputArgs = Utils.Strtok(message, " ", cmd._args);
						cmd.Execute(player, inputArgs, inputArgs.length);

						return 1;
					}
					else
					{
						this.Logger.LogWarn("The prototype for command " + cmd._command + " does not contain the Execute() function");
						return 3;
					}
				}
			}

			if(!cmdFound)
				return 2;
		}

		return 0;
	}
}

module.exports = Plugin;