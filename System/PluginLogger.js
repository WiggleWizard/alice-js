var PluginLogger = function(pluginInstance)
{
	this._pluginName = pluginInstance._name;
}

PluginLogger.prototype = {
	LogInfo: function(message)
	{
		console.log('[\033[34m' + this._pluginName + '\033[0m][\033[92mInfo\033[0m] ' + message);
	},

	LogWarn: function(message)
	{
		console.log('[\033[34m' + this._pluginName + '\033[0m][\033[93mWarn\033[0m] ' + message);
	},

	LogError: function(message)
	{
		console.log('[\033[34m' + this._pluginName + '\033[0m][\033[91mError\033[0m] ' + message);
	}
}

module.exports = PluginLogger;