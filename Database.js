var mysql = require('mysql');

function Database()
{
	this._dbConn;
}

Database.prototype = {

	/**
	 * Connects to a database using JSON file.
	 * 
	 * @param {[type]} detailPath [description]
	 */
	ConnectUsing: function(jsonPath)
	{
		var details = require(jsonPath);

		this._dbConn = mysql.createConnection({
			host     : details.host,
			user     : details.username,
			password : details.password,
			database : details.dbname
		});

		this._dbConn.connect();

		this._dbConn.on('error', function(err)
		{
			console.log('db error', err);

			if(err.code === 'PROTOCOL_CONNECTION_LOST')
			{
				ConnectUsing(jsonPath);
			}
			else
			{
				throw err;
			}
		});
	},
}
module.exports = Database;