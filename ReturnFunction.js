function ReturnFunction(ID, funcName, argv, argt, callback)
{
    this.ID       = ID;
    this.funcName = funcName;
    this.argv     = argv;
    this.argt     = argt;
    
    this.callback = callback;
    
    this.return = null;

    this.packet = null;
}

ReturnFunction.prototype = {

    Compile: function()
    {
        // Determine how big the this.packeter needs to be
        var size = 0;
        size += 1; // - Packet type
        size += 4; // - Payload len
        size += 4; // - Packet ID

        size += 4; // - Function name len
        size += this.funcName.length; // - Function name

        size += 1; // - Arg count

        // - Args
        for(var i = 0; i < this.argv.length; i++)
        {
            size += 1; // -- Argt

            if(this.argt[i] === 1 || this.argt[i] === 2)
                size += 4; // -- (u)int size
            else if(this.argt[i] === 3)
            {
                size += 4; // -- Size of string
                size += this.argv[i].length; // -- String itself
            }
        }

        // Allocate this.packeter
        this.packet = new Buffer(size);
        var c = 0; // Cursor

        // Start putting the this.packeter together
        // - Packet type
        this.packet.writeUInt8("R".charCodeAt(0), c);
        c += 1;
        // - Payload len
        this.packet.writeUInt32BE(size - 5, c);
        c += 4;
        
        // - Packet ID
        this.packet.writeUInt32BE(this.ID, c);
        c += 4;
        // - Function name len
        this.packet.writeUInt32BE(this.funcName.length, c);
        c += 4;
        // - Function name
        this.packet.write(this.funcName, c, this.funcName.length);
        c += this.funcName.length;
        
        // - Arg count
        this.packet.writeUInt8(this.argv.length, c);
        c += 1;
        
        // - Args
        for(var i = 0; i < this.argv.length; i++)
        {
            // -- Argt
            this.packet.writeUInt8(this.argt[i], c);
            c += 1;

            if(this.argt[i] === 1 || this.argt[i] === 2)
            {
                this.packet.writeUInt32BE(this.argv[i], c);
                c += 4;
            }
            else if(this.argt[i] === 3)
            {
                this.packet.writeUInt32BE(this.argv[i].length, c);
                c += 4;
                this.packet.write(this.argv[i], c, this.argv[i].length);
                c += this.argv[i].length;
            }
        }
    },
    
    Parse: function(packet)
    {
        // We can start the cursor pos at 9 to skip the 
        // packet type, length & ID.
        var c = 9;
        
        // -- Arg type
        var returnType = packet.readUInt8(c);
        c += 1;

        // -- Arg value
        if(returnType === 1 || returnType === 2)
        {
            this.return = packet.readUInt32BE(c);
        }
        else if(returnType === 3)
        {
            var s = packet.readUInt32BE(c);
            c += 4;
            
            this.return = packet.toString('utf8', c, c + s);
        }
    },

    GetPacket: function()
    {
        return this.packet;
    },
    
    GetPacketID: function()
    {
        return this.ID;
    },
    
    ExecuteCallback: function()
    {
        this.callback(this.return);
    }
}


module.exports = ReturnFunction;