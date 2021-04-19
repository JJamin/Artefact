// Player
var model = {
    // types: 0 = player, 1 = enemy
    nodes: {
        // nodeID:{type,x,y,dir}
    },
    player: {
        //playerID:{username, capeColor, abilitiesUnlocked, activeAbilities, abilityCooldown}
    },
    enemies: {
        //enemyID:{username,capeColor}
    },
    events: {

    }
}

// -- Variables --
var socket;
var loopHandler;

function SendDataToServer(){
    var data = {
        x: controls.x,
        y: controls.y,
        dir: dir
    }
    socket.emit('update-server', data)
}

// ---- Server ----
function connect() {
    socket = io.connect('http://localhost:8000');
    socketConnections(socket);
    socket.emit('joinGame', "Player");
}

function socketConnections(socket) {

    // -- Lobby Server Messages --
    socket.on('ingame', function (lobbyCode) {
        //Join Success
        // loop();
    });

    socket.on('update-client-nodes', function (updatedNodes) {
        model.nodes = updatedNodes
        syncNodes()
        // console.log(model.nodes)
    });

    socket.on('update-client-playerInfo', function (updatedPlayer) {
        model.player = updatedPlayer
    });

    // -- Handle error --
    socket.on('connect_failed', function () {
        socket.close();
    });

    socket.on('disconnect', function () {
        socket.close();
    });
}

