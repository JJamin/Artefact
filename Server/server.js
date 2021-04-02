// -- Set up socket --
const http = require('http');
const express = require('express');
const socketio = require('socket.io');

const app = express();
const clientPath = 'C:\\Users\\Jody\\Desktop\\Files\\Coding\\Artefact\\Client'; //`${__dirname}/../Client`;
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
var maxPeople = 200;

//Variables
var sockets = {}; //All the sockets of active players ('socketID'->sockets)
var lobbies = {}; //Contains all the active lobbies   ('lobbyID'->lobbyData)
var lobbyCodes = ["NULL"];

//-- Socket Listening --

server.listen(8000, () => {
    console.log('Port listening on 8000')
});

server.on('error', (err) => {
    console.error('Server Error: ', err)
});

io.on('connection', (socket) => {
    //Player Variable
    var player = {
        id: socket.id,
        lobbyID: -1,
        username: "NULL",
        lobbyCode: "----"
    };
    
    //Player Joins the game. Player Setup
    socket.on('joinGame', function(username){
        //If player id already in database, remove
        player.username = username;

        //Add player to socket dictionary
        console.log('User #' + player.username + ' entered the battlefield');
        sockets[player.id] = socket;

        //Enter the player to a battlefield
        lobbyData = enterBattlefield(player);
        player.lobbyID = lobbyData[0]; player.lobbyCode = lobbyData[1];

        //Send to the player that setup is complete
        socket.emit('ingame', player.lobbyCode);
    });

    //update player's key presses and target
    socket.on('update-server', function(msg) {
        // msg = {'target' : player.target, 'keypress' : keypress}
        lobbies[player.lobbyID]['lobby'].send(sendInfo(player.id, 'update-server', msg));
    });

    //--Test-- send anything to the server and print it out
    socket.on('test', function(test) {
        console.log(test);
        console.log(lobbies)
    });

    // --Disconnection--
    socket.on('disconnect', function () {
        console.log('Player' + player.username + 'Disconnected');
        if (sockets[player.id]){
            delete sockets[player.id];
            removeFromLobby(player.id, player.lobbyID)
        }
    });
});

// Start a new lobby
function startLobby(){
    const lobby = fork('game.js');

    // ---- LOBBY COMMANDS ----
    lobby.on('message', (msg) => {
        if (msg['type'] == 'update-client') {
            //msg = {player : player, enemies: [players]}
            sockets[msg['playerID']].emit('update-client', msg['message'])
        }
    });

    lobbies[lobby.pid] = {};
    lobbies[lobby.pid]['players'] = [];
    lobbies[lobby.pid]['lobby'] = lobby;
    lobbies[lobby.pid]['playerCount'] = 1;
    lobbies[lobby.pid]['code'] = util.makeLobbyCode(lobbyCodes);
    lobbyCodes.push(lobbies[lobby.pid]['code'])

    return lobby.pid
}

//Enter a player into a battlefield. If no battlefield is available, create a new one
function enterBattlefield(player, lobbyCode = "NULL"){
    //Find a lobby that doesnt have a max player
    for (let lobby in lobbies) {
        if (lobbies[lobby]['playerCount'] < maxPeople){
            if (lobbyCode != "NULL" && lobbies[lobby]['code'] == lobbyCode){
                try {
                    lobbies[lobby]['playerCount'] += 1;
                    lobbies[lobby]['players'].push(player.id);
                    lobbies[lobby]['lobby'].send(sendInfo(player.id, 'addPlayer', [player.id, player.username]));
                } catch (e) {
                    console.log("Error 2");
                    console.log(e);
                }
                return [lobby, lobbies[lobby]['code']]
            }
        }
    }
    //If you are searching for a lobby but that lobby doesnt exist, return [-1,-1]
    if (lobbyCode != "NULL"){return [-1,-1]}
    //If a lobby isn't found, make a new lobby
    console.log("MAKING A NEW LOBBY")
    lobbyPid = startLobby();
    try {
        lobbies[lobbyPid]['lobby'].send(sendInfo(player.id, 'addPlayer', [player.id, player.username]));
        lobbies[lobbyPid]['players'].push(player.id);
        return [lobbyPid, lobbies[lobbyPid]['code']]
    } catch (e) {
        console.log("Error 1");
        console.log(e);
    }
}

//Remove players from a lobby
function removeFromLobby(playerID, lobbyID){
    if (!lobbies[lobbyID]){return}

    if (lobbies[lobbyID]['playerCount'] == 1){
        lobbyCodeIndex = lobbyCodes.indexOf(lobbies[lobbyID]['code']);
        if (lobbyCodeIndex > -1) {lobbyCodes.splice(lobbyCodeIndex, 1);}
        lobbies[lobbyID]['lobby'].killSignal('SIGTERM');
        delete lobbies[lobbyID];
        return
    }

    lobbies[lobbyID]['playerCount'] = lobbies[lobbyID]['playerCount']-1;
    lobbies[lobbyPid]['lobby'].send(sendInfo(playerID, 'removePlayer', ''));
}

