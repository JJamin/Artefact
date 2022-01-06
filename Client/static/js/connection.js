// Player
var Model = {
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
    abilities: {
        //abilityID:{abilityType:String}
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
        space: controls.space,
        dir: dir
    }
    socket.emit('update-server', data)
}

// Establish websocket connection
function connect() {
    socket = io.connect(`http://${CONFIG.uri}`);
    connectionHandler(socket);
    socket.emit('joinGame', "Player");
}

function connectionHandler(socket) {

    // // -- Lobby Server Messages --
    // socket.on('ingame', function (lobbyCode) {
    //     //Join Success
    //     // loop();
    // });

    socket.on('update-client-nodes', function (updatedNodes) {
        // Model.nodes = {} //  Reset node variable
        
        Model.nodes = updatedNodes
        
        // Notify main.js of update
        syncNodes()
        
    });

    socket.on('update-client-playerInfo', function (updatedPlayer) {
        for (var player in updatedPlayer){
            // G.player = Model.nodes[player]
            G.profile = updatedPlayer[player]
            G.profile.id = player
        }
        syncNodes()
    });

    // -- Handle error --
    socket.on('connect_failed', function () {
        socket.close();
    });

    socket.on('disconnect', function () {
        socket.close();
    });
}

