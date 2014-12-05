var PluginLogger = require('./PluginLogger.js');

function PluginManager()
{
	this.DEFAULT_PRIORITY = 100;

	this._plugins = new Array();

	// Load the priority file
	var fs = require('fs');
	this._priorityList = JSON.parse(fs.readFileSync(__dirname + '/../Plugins/priority.json', 'utf8'));
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

				var Plugin = require('../Plugins/' + file);
				var pluginInstance       = new Plugin();
				pluginInstance.Logger    = new PluginLogger(pluginInstance);
				pluginInstance._filename = file;

				// Find its priority number
				pluginInstance._priority = self._priorityList[file];

				// No priority defined for this plugin, give default
				if(pluginInstance._priority === undefined)
					pluginInstance._priority = self.DEFAULT_PRIORITY;

				// Mark the plugin as loaded
				pluginInstance._loaded = true;

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
			var plugin = this._plugins[i];

			// Check the deps of the plugin
			if(plugin._deps !== undefined)
			{
				var hasDepsInitialized = this.HasDepsInitialized(plugin._deps.split(','));

				if(!hasDepsInitialized)
				{
					console.log('[Alice] Could not initialize plugin ' + plugin._fname + ' because one of the dependencies (' + plugin._deps + ') have not been initialized');
				}
			}

			// Notify that the plugin is being initialized
			if(this._plugins[i].hasOwnProperty("_version"))
				console.log('[Alice] Initializing plugin: ' + plugin._fname + ' <' + plugin._filename + '>');
			else
				console.log('[Alice] Initializing plugin: ' + plugin._fname + ' v' + plugin._version + ' <' + file + '>');

			// Initialize the plugin
			plugin.OnPluginInit();

			// Mark the plugin as initialized
			plugin._initialized = true;
		}
	},

	/**
	 * Checks if the dependencies have been initialized.
	 * @param {Array} deps Dependencies
	 */
	HasDepsInitialized: function(deps)
	{
		var depsLoaded = 0;

		var c = this._plugins.length;
		this._plugins.forEach(function(plugin, i, array)
		{
			deps.forEach(function(dep, j, array)
			{
				if(dep === plugin._name)
				{
					if(plugin._initialized === true)
						depsLoaded++;

					return false;
				}
			});
		});

		// If all the deps that were required have been loaded
		if(depsLoaded === deps.length)
			return true;

		return false;
	}
}

module.exports = PluginManager;