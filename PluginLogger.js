var PluginLogger = function(pluginInstance)
{
	this._pluginName = pluginInstance._name;
}

PluginLogger.prototype = {
	LogInfo: function(message)
	{
		console.log('[Plugin][' + this._pluginName + '][Info] ' + message);
	},

	LogWarn: function(message)
	{
		console.log('[Plugin][' + this._pluginName + '][Warn] ' + message);
	},

	LogError: function(message)
	{
		console.log('[Plugin][' + this._pluginName + '][Error] ' + message);
	}
}

module.exports = PluginLogger;