/**
 * Used to describe an event easier to the machine.
 */

function Event()
{
	this.eventName = "";
	this.argv      = new Array();
}

Event.prototype = {

	GetName: function()
	{
		return this.eventName;
	},

	GetArg: function(index)
	{
		return this.argv[index];
	},

	AddArg: function(argv)
	{
		this.argv.push(argv);
	},

	SetName: function(eventName)
	{
		this.eventName = eventName;
	}
}


module.exports = Event;