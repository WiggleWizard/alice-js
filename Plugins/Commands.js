// var Bang = require('./Bang.js');       // In-game command handler

var Plugin = function()
{
	this._fname   = "Commands"
	this._desc    = "Ability to run commands";
	this._name    = "Commands";
	this._version = "1.0";
	this._enabled = true;
}

Plugin.prototype = {
	OnPluginInit: function()
	{
	},

	/**
	 * Reads all the JS files from Commands directory as objects.
	 */
	LoadCommands: function()
	{

	},

	OnPlayerChat: function(player, message)
	{
		cmdResult = bang.Execute(player, message);

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
	}
}

module.exports = Plugin;