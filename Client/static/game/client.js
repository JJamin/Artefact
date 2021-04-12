// Player
var model = {
    nodes: {
        // node:{type,x,y}
    },
    player: {
        state: {
            
        }
    }
}

var player = {
    username: "NULL",
    lobbyCode: "NULL",
    keypress: {},
    target: {
        x: 0,
        y: 0
    }
}

// -- Animation Frame --
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.msRequestAnimationFrame     ||
            function( callback ) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

// -- Variables --
var socket;
var loopHandler;

// -- Buttons --
function publicClicked(){
    startGame();
}

// -- Loops --
function loop() {
    loopHandler = window.requestAnimFrame(loop);
}

// ---- Server ----
function startGame(){
    console.log("GAME SHOULD HAVE STARTED")
    socket = io.connect('http://localhost:8000');
    socketConnections(socket);
    //socket.emit('joinGame', player.username);//TODO####
    socket.emit('joinGame', "Test Guy");
}

function socketConnections(socket) {

    // -- Lobby Server Messages --
    socket.on('ingame', function (lobbyCode) {
        player.lobbyCode = lobbyCode;

        //Error with joining the game
        if (player.lobbyCode == -1){

        }

        //Join Success
        loop();
    });

    socket.on('update-client', function (data) {
        //data = {player: player, enemies: [visableEnemies]}
        console.log(data)
    });

    // -- Handle error --
    socket.on('connect_failed', function () {
        socket.close();
    });

    socket.on('disconnect', function () {
        socket.close();
    });
}

