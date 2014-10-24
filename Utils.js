var Moment = require('moment');

var Utils = {

	/*==============================================================================================*\
	|* Functions
	\*==============================================================================================*/

	/**
	 * Converts a string to an integer, no fucking around here. String needs to
	 * be a pure string represented integer.
	 * 
	 * Eg: "10 marbles" - null
	 *     "20"         - 20
	 * 
	 * @param  {string} str - Any pure string represented integer.
	 * @return {int}        - Null if conversion failed.
	 */
	ToInt: function(str)
	{
		// Create a test case before doing a regex parse
		var testInt = parseInt(str, 10);

		// Test failed
		if(isNaN(testInt))
			return null;
		// Test passed
		else
		{
			// We need to pick apart the needle, parseInt() will give us false positives as
			// well as Number() constructor. We must use Regex because JS thinks it's too
			// clever ;D
			var re = /^(\d+)$/g;
			var m = re.exec(str);

			// It is truely a number
			if(m != null)
				return parseInt(m[1]);
		}

		// GC
		testInt = null;

		return null;
	},
	
	/**
	 * Splits a string into tokens.
	 * 
	 * @param {string} str       - Input string
	 * @param {string} separator 
	 * @param {uint}   limit
	 * @return {array}
	 */
	Strtok: function(str, separator, limit)
	{
		str = str.split(separator);

		if(str.length > limit)
		{
			var ret = str.splice(0, limit);
			ret.push(str.join(separator));

			return ret;
		}

		return str;
	},

	/**
	 * Generates a random number (int) between min and max
	 * 
	 * @param  {uint} min
	 * @param  {uint} max
	 * @return {uint}
	 */
	Rand: function(min, max)
	{
		return Math.round((Math.random() * (max - min)) + min);
	},

	/**
	 * Filters out IP from a string
	 * 
	 * @param  {string} haystack - The string that contains the IP
	 * @param  {string} replace  - The string you wish to replace with the IP
	 * @return {string}
	 */
	FilterIP: function(haystack, replace)
	{
		return haystack.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/, replace);
	},
	
	/**
	 * Strips all CoD4 related color from in.
	 * 
	 * @param {string} string - String to be stripped.
	 * @return {string}
	 */
	StripColor: function(string)
	{
		return string.replace(/\^\d/g, '');
	},

	AddMacroToMoment: function(moment, macro)
	{
		var weeks   = 0;
		var days    = 0;
		var hours   = 0;
		var minutes = 0;

		// Capture weeks if applicable
		var re = /(\d{1,3})w/g;
		var m  = re.exec(macro);
		if(m !== null && m.length > 0)
			weeks = m[1];
		// Capture days if applicable
		re = /(\d{1,3})d/g;
		m  = re.exec(macro);
		if(m !== null && m.length > 0)
			days = m[1];
		// Capture hours if applicable
		re = /(\d{1,3})h/g;
		m  = re.exec(macro);
		if(m !== null && m.length > 0)
			hours = m[1];
		// Capture minutes if applicable
		re = /(\d{1,3})m/g;
		m  = re.exec(macro);
		if(m !== null && m.length > 0)
			minutes = m[1];

		// Now add to moment
		return moment.add({
			weeks:   weeks,
			days:    days,
			hours:   hours,
			minutes: minutes
		});
	},



	// **************************************************************************
	// PLAYER SEARCH FUNCTIONS
	// **************************************************************************

	



	// **************************************************************************
	// MAP MANIPULATION
	// **************************************************************************

	/**
	 * Gets a map's machine name (mp_*) from its friendly name.
	 * 
	 * @param  {string} mapName - Map's friendly name.
	 * @return {string}         - Null if not found.
	 */
	GetMapMachineName: function(mapName)
	{
		mapName = mapName.toLowerCase();

		var i, len;
		for(i = 0, len = this.mapFriendlyNames.length ; i < len ; i++)
		{
			if(this.mapFriendlyNames[i].toLowerCase() === mapName)
				return this.mapMachineNames[i];
		}

		return null;
	},

	/**
	 * Adds a (custom) map on to the map stacks, so getMapMachineName
	 * can find them.
	 * 
	 * @param  {string} machineName  - Map's machine name, map nam starting with mp_.
	 * @param  {string} friendlyName - Human readable name of the map.
	 */
	PushMap: function(machineName, friendlyName)
	{
		this.mapMachineNames.push(machineName);
		this.mapFriendlyNames.push(friendlyName);
	},



	/*==============================================================================================*\
	|* Variables
	\*==============================================================================================*/

	mapMachineNames: [
		'mp_convoy',
		'mp_backlot',
		'mp_bloc',
		'mp_bog',
		'mp_broadcast',
		'mp_carentan',
		'mp_citystreets',
		'mp_countdown',
		'mp_crash',
		'mp_crash_snow',
		'mp_creek',
		'mp_crossfire',
		'mp_farm',
		'mp_killhouse',
		'mp_overgrown',
		'mp_pipeline',
		'mp_shipment',
		'mp_showdown',
		'mp_strike',
		'mp_vacant',
		'mp_cargoship'
	],
	mapFriendlyNames: [
		'Ambush',
		'Backlot',
		'Bloc',
		'Bog',
		'Broadcast',
		'China Town',
		'Citystreets',
		'Countdown',
		'Crash',
		'Winter Crash',
		'Creek',
		'Crossfire',
		'Downpour',
		'Killhouse',
		'Overgrown',
		'Pipleline',
		'Shipment',
		'Showdown',
		'Strike',
		'Vacant',
		'Wetwork'
	],
	gametypesMachineNames: [
		'war',
		'sd',
		'dm',
		'sab',
		'koth',
		'dom'
	],
	gametypesFriendlyNames: [
		'Team Deathmatch',
		'Search and Destroy',
		'Deathmatch',
		'Sabotage',
		'Headquarters',
		'Domination'
	],
	color: {
		'red':       '^1',
		'green':     '^2',
		'yellow':    '^3',
		'blue':      '^4',
		'lightblue': '^5',
		'pink':      '^6',
		'white':     '^7',
		'grey':      '^8',
		'black':     '^9'
	}
};
module.exports = Utils;