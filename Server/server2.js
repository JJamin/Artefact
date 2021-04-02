// -- Set up socket --
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const clientPath = 'C:\\Users\\Jody\\Desktop\\Files\\Coding\\Collab\\Client'; //`${__dirname}/../Client`;
console.log(`Serving static from ${clientPath}`);

app.use(express.static(clientPath));
const server = http.createServer(app);
const io = socketio(server);

// Import utilities
var util = require('./lib/utilities');
const { fork } = require('child_process');

function sendInfo(p, t, m){
    return ({playerID : p, 
            type : t, 
            message : m});
}

//Config File Variables
var minPeople = 1;
var maxPeople = 60;
var countdownLength = 5;

//Variables
var waiting = {};
var sockets = {};
var lobbies = {};
var gameState = 'title'
var seconds = 0;
var interval;

//-- Socket Listening --

io.on('connection', (socket) => {

    //Player Variable
    var player = {
        id: socket.id,
        position: {
            x: 0,
            y: 0
        },
        target: {
            x: 0,
            y: 0
        },
        keypress: {},
        screen: {
            width: 0,
            height: 0
        },
        color: util.randomColor(),
        username: "NULL",
        lobbyID: 0
    };
    
    //Player Leaves Waiting and oining the Game Lobby
    socket.on('joinGame', function(p){
        if (waiting[player.id]){
            delete waiting[player.id];
            delete sockets[player.id];
        }

        player.screen = p.screen;
        player.username = p.username;

        //Add player to socket and waiting dictionary
        console.log('User #' + player.id + ' entered the battlefield');
        sockets[player.id] = socket;
        waiting[player.id] = player;

        socket.emit('matchmaking', player);
        gameState = 'waiting';

        //Update all players on who is waiting
        var names = [];
        for (var i = 0; i < Object.values(waiting).length; ++i){
            names.push([Object.values(waiting)[i].username, 0]);
        }
        for(var playerID in sockets) {
            (sockets[playerID]).emit('playersWaiting', names);
        }

        if (Object.keys(waiting).length >= maxPeople){
            clearInterval(interval); 
            seconds = 0;
            startLobby();
        } else if (Object.keys(waiting).length == 1){
            startCountdown(countdownLength);
            socket.emit('counter', seconds);
        } else {
            socket.emit('counter', seconds);
        }
    });

    //update player's key presses and target
    socket.on('update', function(update) {
        if (gameState == 'inGame'){
            lobbies[player.lobbyID]['lobby'].send(sendInfo(player.id, 'update', update));
        }
    });

    //--Test--
    socket.on('test', function(test) {
        console.log(test);
    });

    // --Disconnection--
    socket.on('disconnect', function () {
        //TODO UNCOMMENT
        // if (waiting[player.id]){
        //     delete waiting[player.id];
        //     delete sockets[player.id];
        // }
        console.log('Player Disconnected');
    });
});

server.on('error', (err) => {
    console.error('Server Error: ', err)
});

server.listen(8000, () => {
    console.log('Port listening on 8000')
});

// -- Lobby Finding Functions --
function startCountdown(sec) {
   seconds = sec;     
   interval = setInterval(function() {
        if(seconds-- == 0){
             clearInterval(interval); 
             startLobby();
        }

        for(var playerID in sockets) {
            (sockets[playerID]).emit('counter', seconds);
        }
   },1000)
}

function startLobby(){

    if (Object.keys(waiting).length == 0){
        countdownLength = -1;
        return;
    } else if (Object.keys(waiting).length < minPeople){
        startCountdown(countdownLength);
        return;
    }

    const lobby = fork('game.js');

    try {
        lobby.send(sendInfo('', 'init', waiting));
    } catch (e) {
        console.log(e);
    }

    // ---- LOBBY COMMANDS ----
    lobby.on('message', (msg) => {
        if (msg[0] == 'emit'){
            // sockets[msg[1].playerID].emit(msg[1].type, msg[1].message);
        }
        console.log('Message from child', msg);
    });

    for (var playerID in waiting){
        waiting[playerID].lobbyID = lobby.pid;
        sockets[playerID].emit("lobbyStart");
    }

    lobbies[lobby.pid] = sockets;
    lobbies[lobby.pid]['lobby'] = lobby;
    waiting = {};
    sockets = {};

    gameState = 'inGame';
}

