let express = require('express');
let {Message} = require("./db");
let app = express();
app.use(express.static(__dirname));
console.log("aaa", __dirname)
let server = require("http").createServer(app);
let io = require("socket.io")(server);
let SYSTEM = '系统'
let sockets = {}
//监听客户端的连接事件 当客户连接上来户 执行回调函数
io.on('connection',async function (socket) {
    // console.log("服务器接收到客户端的连接")
    //emitter on emit
    let username;
    let rooms = []; //代表客户端进入的所有房间
    socket.on('getAllMessages',async function(){
       let messages = await Message.find().sort({creatAt:-1}).limit(10);
       messages.reverse();
       socket.emit("allMessages",messages);
    })
    socket.on('join',async function(roomName){
        let index = rooms.indexOf(roomName)
        if(index == -1){
            rooms.push(roomName);
            socket.join(roomName);
            socket.emit("joined",roomName)
        }
        
    })
    socket.on('leave',async function(roomName){
        let index = rooms.indexOf(roomName)
        if(index != -1){
            rooms.splice(index,1);
            socket.leave(roomName);
            socket.emit("leave",roomName)
        }
        
    })
    
    socket.on('message',async function (content) {
        // console.log("message",content);
        // socket.send('服务器说：'+ message)
        console.log("username", username)
        if (username) {
            let result = content.match(/@([^ ]+) (.+)/);
            if(result){ //私聊
                let toUser = result[1];
                let toContent = result[2];
                let toSocket = sockets[toUser];
                let mySocket = sockets[username];
                mySocket&&mySocket.emit('message',getMsg(toContent,username))
                toSocket&&toSocket.emit('message',getMsg(toContent,username))

            }else{//公聊
                let savedMessage = await Message.create(getMsg(content, username))
                if(rooms.length>0){
                    //循环所有的房间
                    
                    rooms.forEach(room=>{
                        io.in(room).emit('message',savedMessage);
                    })
                }else{
                    //如果在大厅说话，则所有的人都能听的到，包括其他大厅的人和所有房间的人
                    io.emit('message',savedMessage);
                }
               
            }
           
        } else {
            let oldSocket = sockets[content];
            if(oldSocket){
                socket.emit("message",getMsg(`${content}已经被占用，清换一个用户名把！`))
            }else{
                username = content; //把这条消息的内容设置为用户名
                //告诉所有的客户端有新的用户加入了聊天室
                //io.emit('message',getMsg(username+'加入聊天室'))
                sockets[username] = socket;
                socket.broadcast.emit('message', getMsg(username + '加入聊天室'))
                // io.emit('message', getMsg(username + '加入聊天室'))
            }
           
        }

    })
})

function getMsg(content, username = SYSTEM) {
    return {
        username,
        content,
        
    }
}

/*
Socket.prototype.send = function(){
    var args = Array.from(arguments) //[hello]
    args.unshift("message"); // ['message','hello']
    // this.emit.apply(this,args)
    this.emit(...args);
}
*/

server.listen(3000)