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
                player.Tell(
                    "^5[" + playerArray[i].GetSlotID() + "] ^7" +
                    playerArray[i].GetName() +
                    " ^5[" + playerArray[i].GetIP() + "]");
            }
        }
    }
}
module.exports = Printer;