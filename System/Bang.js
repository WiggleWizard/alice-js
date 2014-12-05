
/*===========================================================*\
 
 
 
	  '########:::::'###::::'##::: ##::'######:::
	   ##.... ##:::'## ##::: ###:: ##:'##... ##::
	   ##:::: ##::'##:. ##:: ####: ##: ##:::..:::
	   ########::'##:::. ##: ## ## ##: ##::'####:
	   ##.... ##: #########: ##. ####: ##::: ##::
	   ##:::: ##: ##.... ##: ##:. ###: ##::: ##::
	   ########:: ##:::: ##: ##::. ##:. ######:::
	  ........:::..:::::..::..::::..:::......::::
		    - AliceScript Command Helper -
	       \ Terence-Lee 'Zinglish' Davis /
 
 
 
\*===========================================================*/

var Utils = require('./Utils');
 
 
/* Bang class */
function Bang(wonderland)
{
	// Contains an array of BangCmd
	this.cmds = new Array();

	this._wonderland = wonderland;
}
 
Bang.prototype = {
 
	/**
	 * Stacks a command object into the internal array
	 * @param  {string} command      Command name (Without the directive)
	 * @param  {string} requiredPerm Required perm key to be able to execute the command
	 * @param  {array}  argc         Argument count
	 * @param  {func}   bind         The function that is executed
	 * @return        
	 */
	RegisterCommand: function(command, requiredPerm, argc, bind)
    {
		this.cmds.push(new BangCmd(command, requiredPerm, argc, bind))
	},
 
	/**
	 * Attempts to execute the message as one of the registered functions
	 * @param  {Player}  player   Player object
	 * @param  {string}  message  Player's chat message
	 * @return {uint}    Returns: 0 - Not a command at all
	 *                            1 - Command successful
	 *                            2 - Command does not exist
	 *                            3 - Command found but failed due to improper bind
	 *                            4 - Permission required to execute the command
	 */
	Execute: function(player, message)
    {
		// Check if there's a descriptor at the beginning of the message
		if(message.charAt(0) === "!" && message !== "!")
		{
			// Store the result of the search
			cmdFound = false;
 
			// Store the input command string
			// Eg: if the input was: "!me test"
			// then storage would look like this: "me", this also works for
			// input that has no parameters
			var inputCmd;
			if(message.indexOf(' ') > 0)
				inputCmd = message.substr(1, message.indexOf(' ') - 1);
			else
				inputCmd = message.substr(1);
 
			// Loop through all the registered commands
			for(var i=0;i<this.cmds.length;i++)
			{
				// Check the command
				if(inputCmd === this.cmds[i].command)
				{
					cmdFound = true;
 
					if(typeof this.cmds[i].bind === 'function')
					{
						// Check the player's perm
						if(this.cmds[i].perm != null && !player.HasPerm(this.cmds[i].perm))
							return 4;
 
						// Split the message up by spaces and exec the command
						inputArgs = Utils.Strtok(message, " ", this.cmds[i].argc);
						this.cmds[i].bind(player, inputArgs, this._wonderland);
 
						return 1;
					}
					else
					{
						console.log("Bang: '" + this.cmds[i].command + "' does not have a function bound to the command");
						return 3;
					}
				}
			}
 
			if(!cmdFound)
				return 2;
		}
 
		return 0;
	}
};
module.exports = Bang;
 
/* Command Object */
function BangCmd(command, requiredPerm, argc, bind)
{
	this.command  = command;
	this.perm     = requiredPerm;
	this.argc     = argc;
	this.bind     = bind
}