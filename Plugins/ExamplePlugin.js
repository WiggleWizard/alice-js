var Plugin = function()
{
	this._fname   = "Example Plugin" // Friendly name
	this._name    = "examplePlugin"; // Machine name
	this._version = "1.0";           // Version
	this._enabled = false;
}

Plugin.prototype = {
	OnPluginInit: function() {},

	OnPlayerChat: function(player, message)
	{
		this.Logger.LogInfo(player.GetName() + ': ' + message);
		Alice.BroadcastChat(player.GetName() + ': ^7' + message);

		// We politely return the message here, if we do not return anything
		// or return 'undefined' then the next plugin will use this message
		// un-altered.
		// 
		// Returning a message here, altered or un-altered, means that the
		// next priority plugin will use this message.
		return message;
	},

	OnJoinRequest: function(ipAddress, qPort)
	{
		Alice.JoinRequestAccept(ipAddress, qPort);
	}
};

module.exports = Plugin;