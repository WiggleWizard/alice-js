var Plugin = function()
{
	this._fname   = "Example Plugin" // Friendly name
	this._name    = "examplePlugin"; // Machine name
	this._version = "1.0";           // Version
	this._enabled = false;
}

Plugin.prototype = {
	OnPluginInit: function()
	{
		this.Logger.LogInfo("Test info log");
	},

	OnPlayerChat: function(player, message)
	{
		
	}
};

module.exports = Plugin;