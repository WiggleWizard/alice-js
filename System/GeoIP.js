/**
 * Designed to be a static object
 */

var http = require('http');

function GeoIP() {}

GeoIP.CACHE = new Array(); // Holds an array of objects: [{ ip, geoData }, ... ]
GeoIP.CACHE_CURSOR = 0;
GeoIP.CACHE_MAX_SIZE = 30;

GeoIP.prototype = {

	/**
	 * Geo locates IP. Uses cache for speed and to avoid limits.
	 * 
	 * @param {Function} callback - Called after geo location was successful.
	 */
	Locate: function(ip, callback)
	{
		var self = this;

		// Checks cache first
		var s = GeoIP.CACHE.length;
		for(var i = 0; i < s; i++)
		{
			if(GeoIP.CACHE[i].ip === ip)
			{
				callback(GeoIP.CACHE[i].geoData);
				return;
			}
		}

		// If nothing was found in cache then we do a call to third party web
		// we then cache the data in a ring buffer.
		var options = {
			host: 'ip-api.com',
			port: 80,
			path: '/json/' + ip
		};

		var req = http.request(options, function(res) 
		{
			res.setEncoding('utf8');

			res.on('data', function (chunk)
			{
				// Parse the data and add it to cache
				var geoData = JSON.parse(chunk);

				GeoIP.CACHE[GeoIP.CACHE_CURSOR] = {
					ip: ip,
					geoData: geoData
				}
				GeoIP.CACHE_CURSOR++;

				// Reset the cache cursor, so we end up overwriting older data
				if(GeoIP.CACHE_CURSOR > GeoIP.CACHE_MAX_SIZE)
					GeoIP.CACHE_CURSOR = 0;

				// Call the input
				callback(geoData);
			});
		});

		req.on('error', function(e)
		{
			console.log('problem with request: ' + e.message);
		});

		req.end();
	},

	LocateFromCache: function(ip, copy)
	{
		// Checks cache first
		var s = GeoIP.CACHE.length;
		for(var i = 0; i < s; i++)
		{
			if(GeoIP.CACHE[i].ip === ip)
			{
				// Do a deep copy of the data
				if(copy === true)
					return JSON.parse(JSON.stringify(GeoIP.CACHE[i].geoData));

				return GeoIP.CACHE[i].geoData;
			}
		}
	}
}
module.exports = GeoIP;