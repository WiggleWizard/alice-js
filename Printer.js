/**
 * Contains common printing patterns.
 */
var Printer = {
	
	/**
	 * Lists players in the player array for a certain player.
	 * 
	 * @param {Player} player              - Player to list array for.
	 * @param {Array}  playerArray[Player]
	 */
	ListPlayersFor: function(player, playerArray)
	{
		var s = playerArray.length;
		for(var i = 0; i < s; i++)
		{
			if(playerArray[i].IsConnected())
			{
				// Select color depending on if the player is logged on or not
				var color = '^7';

				if(playerArray[i].IsSignedIntoSigil())
					color = '^2';
				
				player.Tell(
					"^5[" + playerArray[i].GetSlotID() + "] " + color +
					playerArray[i].GetCleanName() +
					" ^5[" + playerArray[i].GetIP() + "]"
				);
			}
		}
	},

	/**
	 * Returns an ASCII box for the player on the notice screen.
	 * 
	 * @param {[type]} title [description]
	 * @param {[type]} body  [description]
	 */
	GenerateNotice: function(title, titleColor, body, boxColor)
	{
		return  titleColor + "= " + title + " =\n" +
				boxColor + "/----------------------------------------------------------------\\\n" +
				body + "\n"+
				boxColor + "\\----------------------------------------------------------------/";
	},
}
module.exports = Printer;