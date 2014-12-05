var Plugin = function()
{
	this._fname   = "Mute/Unmute"
	this._desc    = "Adds muting and unmuting to the Player object prototype";
	this._name    = "MuteUnmute";
	this._version = "1.0";
	this._enabled = true;
}

Plugin.prototype = {
	OnPluginInit: function()
	{
		Player._muted = false;

		Player.prototype.Mute = function()
		{
			this._muted = true;
		}

		Player.prototype.Unmute = function()
		{
			this._muted = false;
		}

		Player.prototype.IsMuted = function()
		{
			return this._muted;
		}
	},

	OnPlayerChat: function(player, message)
	{
		// If the player is muted the we return false which will stop propagation
		if(player.IsMuted())
		{
			player.Tell('^1You are muted');
			return false;
		}

		return message;
	}
}

module.exports = Plugin;