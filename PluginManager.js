var PluginLogger = require('./PluginLogger.js');

function PluginManager()
{
	this.DEFAULT_PRIORITY = 100;

	this._plugins = new Array();

	// Load the priority file
	var fs = require('fs');
	this._priorityList = JSON.parse(fs.readFileSync('./Plugins/priority.json', 'utf8'));
}

PluginManager.prototype = {

	/**
	 * Loops through all the files in the Plugin directory and includes
	 * them then initializes them.
	 */
	LoadPlugins: function()
	{
		var self = this;

		var fs = require('fs');
		fs.readdir('Plugins', function(err, files)
		{
			if(err) throw err;
			files.forEach(function(file)
			{
				// Ensure that we only attempt to run JS files
				if(file.slice(-3) !== '.js')
					return;

				console.log('[Alice] Found plugin: ' + file);

				var Plugin = require('./Plugins/' + file);
				var pluginInstance       = new Plugin();
				pluginInstance.Logger    = new PluginLogger(pluginInstance);
				pluginInstance._filename = file;

				// Find its priority number
				pluginInstance._priority = self._priorityList[file];

				// No priority defined for this plugin, give default
				if(pluginInstance._priority === undefined)
					pluginInstance._priority = self.DEFAULT_PRIORITY;

				// Throw the plugin on to the stack
				self._plugins.push(pluginInstance);
			});

			self.PrioritizePlugins();
		});
	},

	/**
	 * Arranges found plugins according to the priority number it's given.
	 */
	PrioritizePlugins: function()
	{
		this._plugins.sort(function(a, b)
		{
			if(a._priority > b._priority)
				return 1;
			if(a._priority < b._priority)
				return -1;

			return 0;
		});

		this.InitializePlugins();
	},

	/**
	 * Calls the initializing function in the plugin.
	 */
	InitializePlugins: function()
	{
		for(var i=0; i < this._plugins.length; i++)
		{
			// Notify that the plugin is being initialized
			if(this._plugins[i].hasOwnProperty("_version"))
				console.log('[Alice] Initializing plugin: ' + this._plugins[i]._fname + ' <' + this._plugins[i]._filename + '>');
			else
				console.log('[Alice] Initializing plugin: ' + this._plugins[i]._fname + ' v' + this._plugins[i]._version + ' <' + file + '>');

			// Initialize the plugin
			this._plugins[i].OnPluginInit();
		}
	}
}

module.exports = PluginManager;