var Command = function()
{
	this._command = 'ping';
	this._usage   = 'ping';
	this._desc    = 'Used mostly to check if Alice is running, or to annoying her...';
	this._args    = 0;
}

Command.prototype = {

	Execute: function(player, argv, argc)
	{
		Alice.BroadcastChat('^2Pong :D');
	}
}

module.exports = new Command();