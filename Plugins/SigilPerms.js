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
		
	}
}

module.exports = Plugin;