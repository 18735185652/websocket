let mongoose = require("mongoose");
let conn = mongoose.createConnection("mongodb://localhost:27017/zfchat",{ useNewUrlParser: true,useUnifiedTopology: true  });
let MessageSchema = new mongoose.Schema({
    username:String,
    content:String,
    creatAt:{type:Date,default:Date.now},
   
})

let Message = conn.model("Message",MessageSchema)

module.exports = {Message}
