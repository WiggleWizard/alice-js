var Event = require('./Event.js');

/**
 * Parses event type packets into Event objects.
 * 
 * @param Buffer packet Must be the whole packet, with packet
 *                      type and length.
 * @return Event The Event object.
 */
exports.Parse = function(packet)
{
	var e = new Event();
	var c = 5; // Cursor position

	// Start parsing the packet
	// - Event name size
	var eventNameSize = packet.readUInt32BE(c);
	c += 4;
	// - Event name
	e.SetName(packet.toString('utf8', c, c + eventNameSize));
	c += eventNameSize;

	// - Arg count
	var argc = packet.readUInt32BE(c);
	c += 4;
	// - Args
	for(var i = 0; i < argc; i++)
	{
		// -- Arg type
		var argt = packet.readUInt8(c);
		c += 1;

		// -- Arg value
		if(argt === 1 || argt === 2)
		{
			e.AddArg(packet.readUInt32BE(c));
			c += 4;
		}
		else if(argt === 3)
		{
			s = packet.readUInt32BE(c);
			c += 4;
			
			e.AddArg(packet.toString('utf8', c, c + s));
			c += s;
		}
	}

	return e;
}