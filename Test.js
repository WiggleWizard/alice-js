var PluginLogger = require('./PluginLogger.js');

var Plugin1 = require("./Plugins/ExamplePlugin.js");
//var Plugin2 = require("./Plugins/ExamplePlugin2.js");

var plugin1 = new Plugin1();
plugin1.Logger = new PluginLogger(plugin1);
//var plugin2 = new Plugin2();

//Plugin2.Logger = new PluginLogger(plugin2);

plugin1.OnPluginInit();
//plugin2.OnPluginInit();