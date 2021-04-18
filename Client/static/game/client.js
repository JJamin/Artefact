// Player
var model = {
    // types: 0 = player, 1 = enemy
    nodes: [
        // node:[{id,type,x,y}, ...]
    ],
    player: {
        //playerID:{username, capeColor, abilitiesUnlocked, activeAbilities, abilityCooldown}
    },
    enemies: {
        //enemyID:{username,capeColor}
    },
    events: {

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
// function loop() {
//     loopHandler = window.requestAnimFrame(loop);
//     TemporarySendDataToServer()
// }

// function TemporarySendDataToServer(){
//     var data = {
//         keypress: keys
//     }
//     socket.emit('update-server', data)
// }

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
        //Join Success
        // loop();
    });

    socket.on('update-client-nodes', function (updatedNodes) {
        model.nodes = updatedNodes
        console.log(model.nodes)
    });

    // -- Handle error --
    socket.on('connect_failed', function () {
        socket.close();
    });

    socket.on('disconnect', function () {
        socket.close();
    });
}

