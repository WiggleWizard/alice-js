var mysql = require('mysql');

var Plugin = function()
{
	this._fname   = "Sigil Database";
	this._desc    = "Provides a database connection for Sigil";
	this._name    = "SigilDatabase";
	this._version = "1.0";
	this._enabled = false;
}

Plugin.prototype = {
	OnPluginInit: function()
	{
		global.Database = this.ConnectUsing('./SigilDatabase.conf.json');
	},

	/**
	 * Connects to a database using JSON file.
	 * 
	 * @param {[type]} detailPath [description]
	 */
	ConnectUsing: function(jsonPath)
	{
		var details = require(jsonPath);

		var dbConn = mysql.createConnection({
			host     : details.host,
			user     : details.username,
			password : details.password,
			database : details.dbname
		});

		dbConn.connect();

		this.Logger.LogInfo('Database connection successful');

		dbConn.on('error', function(err)
		{
			console.log('db error', err);

			if(err.code === 'PROTOCOL_CONNECTION_LOST')
			{
				this.ConnectUsing(jsonPath);
			}
			else
			{
				throw err;
			}
		});

		return dbConn;
	}
};

module.exports = Plugin;