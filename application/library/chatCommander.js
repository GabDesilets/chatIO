/**
 * User : Gabriel
 * Date : 19/01/14
 * Time : 7:49 PM
 * Usage: TODO
 */

'use strict';

/**
 *
 * @param io         \socket.io
 * @param onlineList array()
 *
 * @constructor
 */
var ChatCommander = function(io, onlineList) {
    this.io = io;
    this.commands = {
        '/h or /help' : '/h or /help will show this menu .',
        '/w, /whisp or /whisper' : '/w, /whisp or /whisper  [username] [message] .',
        '/cls' : 'To clear the screen .',
        '/who' : 'To see who\'s online.'
    };
    this.who            = onlineList;
    this.fs             = require('fs');
    this.chatWhiteList  = JSON.parse(this.fs.readFileSync('./white_list.json'));

    this.trollUrl       = [
        'http://georgekostuch.com/wp-content/uploads/2013/10/umadbro.jpg',
        'http://25.media.tumblr.com/tumblr_m0ivwtruZD1qktyabo1_500.jpg',
        'http://static.fjcdn.com/pictures/Suprise+Mothafucka.+Found+on+interweb+sorry+if+repost_8f4912_3999724.jpg',
        'http://wakpaper.com/large/Rivers_wallpapers_458.jpg',
        'http://4.bp.blogspot.com/_kROEd6zZmN8/TT0c3BVmAbI/AAAAAAAAAUg/vBIQWWgMPz4/s1600/nicolas-cage-hair-is-a-bird.jpg',
        'http://www.quickmeme.com/img/b3/b301df8a243d57078095f3738336e0e2cb05a245447050ade0bdadba7586d23d.jpg'
    ];

    /**
     * I know i shouldn't mix the way im going but meh !
     *
     * @param username
     * @returns {*}
     */
    this.getUserIndex = function(username) {

        var i = 0;

        for(i ; i <= this.chatWhiteList.users.length - 1; i++) {
            if (this.chatWhiteList.users[i].username == username) {
                return i;
            }
        }
        return false;
    };
};

/**
 * Get the command that the user typed
 *
 * @param message string
 * @returns {string/undefined}
 */
ChatCommander.prototype.getCommand = function(message) {
    return message.split(" ")[0];
};

/**
 * Get the first param of a command that the admin typed
 *
 * @param message string
 * @returns {string/undefined}
 */
ChatCommander.prototype.getFirstParam = function(message) {
    return message.split(" ")[1];
};

/**
 * Get the second param of a command that the admin typed
 *
 * @param message string
 * @returns {string/undefined}
 */
ChatCommander.prototype.getSecondParam = function(message) {
    return message.split(" ")[2];
};

/**
 * Get the third param of a command that the admin typed
 *
 * @param message string
 * @returns {string/undefined}
 */
ChatCommander.prototype.getThirdParam = function(message) {
    return message.split(" ")[3];
};

/**
 * Get the message that the user want to send
 *
 * @param message
 * @returns {string}
 */
ChatCommander.prototype.getWhisperMessage = function(message) {
    var msg = message.split(" ")[2],
        idx;
    if (msg) {
         idx = message.indexOf(msg);
        return message.substring(idx);
    }
    return '';
};

/**
 *
 *
 * @param username
 * @returns {socket/null}
 */
ChatCommander.prototype.getTargetedUserSocket = function(username) {
    var sock = null;
    this.io.sockets.clients().forEach(function (socket) {
        if (socket.username == username) {
            sock = socket;
        }
    });
    return sock;
};

/**
 * Manage the admin commands, if a normal user command is type it will point to the normal user manager
 *
 * @param command string
 * @param socket  \socket
 * @param data    string
 */
ChatCommander.prototype.executeCommand = function(command, socket, data) {
    switch(command) {
        case '/kick' :
            this.doKick(socket, data);
            break;
        case '/cls':
            this.doClearScreen(socket, this.getFirstParam(data) === '-a');
            break;
        case '/ch' :
            if (this.getFirstParam(data) === '-u') {
                this.doRename(socket, data);
            }
            else if(this.getFirstParam(data) === '-p') {
                this.doChangePassword(socket, data);
            }
            else {
                socket.emit('newMessage', 'SERVER', this.getFirstParam(data) + ' is an invalid command.');
            }

            break;
        case '/w' :
        case '/who' :
        case '/whisp' :
        case '/whisper' :
        case '/h':
        case '/help':
            this.executeNormalCmd(command, socket, data);
            break;
        default :
            this.io.sockets.emit('newMessage', socket.username, data);
            break;
    }
};

/**
 * Manage the normal user commands
 *
 * @param command string
 * @param socket  \socket
 * @param data    string
 */
ChatCommander.prototype.executeNormalCmd = function(command, socket, data) {
    switch(command) {
        case '/w' :
        case '/whisp' :
        case '/whisper' :
            this.doWhisper(socket, data);
            break;
        case '/cls':
            this.doClearScreen(socket, false);
            break;
        case '/h':
        case '/help':
            this.doHelp(socket);
            break;
        case '/who':
            this.doWhoIsOnline(socket);
            break;
        default :
            this.io.sockets.emit('newMessage', socket.username, data);
            break;
    }
};


ChatCommander.prototype.doClearScreen = function(socket, doAll) {
    if (doAll) {
        this.io.sockets.emit('clearScreen',socket.username, '');
    }
    else {
        socket.emit('clearScreen',socket.username, '');
    }
};

ChatCommander.prototype.doWhoIsOnline = function(socket) {
    var who = 'Who\'s online: ',
        i = 0;
    for (i; i < this.who.length; i++) {
        who += this.who[i] + '-';
    }
    socket.emit('newMessage', 'SERVER', who);
};

ChatCommander.prototype.doWhisper = function(socket, data) {
    var  skt = this.getTargetedUserSocket(this.getFirstParam(data));

    if(skt) {
        skt.emit('newMessage', 'SERVER whisper from ' + socket.username, this.getWhisperMessage(data));
        socket.emit('newMessage', 'SERVER to ' + skt.username, this.getWhisperMessage(data));
    }
    else {
        socket.emit('newMessage', 'SERVER', 'Trying to whisper someone who isn\'t there...');
    }
};

ChatCommander.prototype.doHelp = function(socket) {
    var key;
    for (key in this.commands) {
        if (this.commands.hasOwnProperty(key)) {
            socket.emit('newMessage', 'SERVER', key + ': ' + this.commands[key]);
        }
    }
};

ChatCommander.prototype.doKick = function(socket, data) {

    var skt = this.getTargetedUserSocket(this.getFirstParam(data));

    if(skt) {
        skt.emit('newMessage', 'SERVER', 'Suck to be you, you\'ve been kicked.');
        skt.broadcast.emit('newMessage', 'SERVER', this.getFirstParam(data) + ' has been kick hahahaha.');
        skt.emit('trollRedirect', this.getTrollUrl());
    }
    else {
        socket.emit('newMessage', 'SERVER', 'Trying to kicked someone who isn\'t there...');
    }
};


ChatCommander.prototype.doRename = function(socket, data) {

    var forUser   = this.getSecondParam(data),
        newName   = this.getThirdParam(data),
        userIndex = this.getUserIndex(forUser);

    if (userIndex) {
       this.chatWhiteList.users[userIndex].username = newName;

        this.writeJSON(this.chatWhiteList, this.renameSuccess(forUser, newName, socket));
    }
    else {
        socket.emit('newMessage', 'SERVER', 'Trying to rename someone who isn\'t in the white list...');
    }

};


ChatCommander.prototype.doChangePassword =  function(socket, data) {

    var forUser     = this.getSecondParam(data),
        newPassword = this.getThirdParam(data),
        userIndex   = this.getUserIndex(forUser);

    if (userIndex) {

        this.chatWhiteList.users[userIndex].password = newPassword;

        this.writeJSON(this.chatWhiteList, this.changePasswordSuccess(newPassword, forUser, socket));
    }
    else {
        socket.emit('newMessage', 'SERVER', 'Trying to change the password someone who isn\'t in the white list...');
    }
};

ChatCommander.prototype.getTrollUrl = function() {
    var rdn = Math.floor((Math.random() * 6));

    return this.trollUrl[rdn];
};

ChatCommander.prototype.writeJSON = function(newWhiteList, callback) {

    this.fs.writeFile('./white_list.json',  JSON.stringify(newWhiteList, null, 4), function (err) {
        if (err) {
            console.log(err);
        }
        else {
            callback;
        }
    });
};

ChatCommander.prototype.renameSuccess = function(oldName, newName, socket) {
    console.log('success');
    socket.broadcast.emit('newMessage', 'SERVER', oldName + ' has changed name to ' + newName + '...he\'s a faggot');
    socket.emit('newMessage', 'SERVER', oldName + ' has changed name to ' + newName + ' successfully');

    var skt = this.getTargetedUserSocket(oldName),
        i = 0;

    if(skt) {
        skt.username = newName;
    }

    for(i; i < this.who.length; i++) {
        if(this.who[i] == oldName) {
            this.who[i] = newName;
        }
    }
};


ChatCommander.prototype.changePasswordSuccess = function(newPassword, forUser, socket) {

    socket.emit('newMessage', 'SERVER', forUser + ' has changed password to ' + newPassword + ' successfully');

    var skt = this.getTargetedUserSocket(forUser);
    if(skt) {
        skt.emit('newMessage', 'SERVER', 'Your password has been change successfully');
        skt.emit('newMessage', 'SERVER', 'Your new password is: ' + newPassword);
    }
};

module.exports = ChatCommander;

