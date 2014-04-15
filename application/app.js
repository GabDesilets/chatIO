/**
 * User : Gabriel
 * Date : 05/02/14
 * Time : 12:30 PM
 * Usage: TODO
 */
var app      = require('express')()
    , server = require('http').createServer(app)
    , io     = require('socket.io').listen(server);

var qs             = require('querystring');
var fs             = require('fs');
var path           = require('path');
var ChatCommander  = require('./library/chatCommander');
var sanitizer      = require('sanitizer');
var express        = require('express');
var connectedUsers = [];
var chatCommander  = new ChatCommander(io, connectedUsers);
var chatWhiteList  = {};

app.use("/css", express.static(__dirname+'/css'));
app.use("/js", express.static(__dirname+'/js'));
app.use("/img", express.static(__dirname+'/img'));
app.use(express.static(__dirname + '/public'));
app.use(express.bodyParser());

server.listen(8080);

function getUser(username) {
    console.log(chatWhiteList.users.length);
    for(var i = 0; i <= chatWhiteList.users.length - 1; i++) {
        if (chatWhiteList.users[i].username == username) {
            return chatWhiteList.users[i];
            break;
        }
    }
    return false;
}

app.get('/', function (req, res) {
    res.sendfile(__dirname+'/views/chat.html');
});

io.sockets.on('connection', function (socket) {

     chatWhiteList  = JSON.parse(fs.readFileSync(__dirname+'/white_list.json'));

    /**
     * Executed when the someone send a new message.
     * will bind with newMessage on the client-side
     */
    socket.on('message', function (data) {
        var user = getUser(socket.username);
        if (data.trim() != "") {
            if(user.uberUser == "true") {
                chatCommander.executeCommand(
                    chatCommander.getCommand(data),
                    socket,
                    sanitizer.sanitize(data)
                );
            }
            else {
                // we tell the client to execute 'newMessage' with 2 parameters
                chatCommander.executeNormalCmd(
                    chatCommander.getCommand(data),
                    socket,
                    sanitizer.sanitize(data)
                );
            }
        }

    });


    /**
     * Executed when the client enter the page we valid if he's in our white-list
     */
    socket.on('acceptUser', function(username, password){

        var user = getUser(username);

        // we store the username in the socket session for this client
        if (user && user.password == password  && connectedUsers.indexOf(username) == -1) {
            socket.username = username;
            connectedUsers.push(username);
            // echo to client they've connected
            socket.emit('newMessage', 'SERVER', 'you have connected');
            chatCommander.doWhoIsOnline(socket);
            // echo globally (all clients) that a person has connected
            socket.broadcast.emit('newMessage', 'SERVER', username + ' has connected');
        }
        else {
            socket.emit('accessDenied', 'SERVER', 'You don\'t have access to the chat sorry, contact Gabriel for further information.');
            socket.disconnect();
        }

    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function(){
        // echo globally that this client has left
        for(var i=0; i<connectedUsers.length; i++) {
            if(connectedUsers[i] == socket.username) {
                connectedUsers.splice(i, 1);
            }
        }
        chatCommander.doClearScreen(socket, false);
        socket.broadcast.emit('newMessage', 'SERVER', socket.username + ' has disconnected');
    });
});