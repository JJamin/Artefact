// Player
var model = {
    nodes: {
        // node:{img,x,y}
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

// -- Variables --
var socket;
var loopHandler;

// -- Buttons --
function publicClicked(){
    if (checkUsername() != 1){return};
    startGame();
}

function privateClicked(){
    socket.emit('test', "hello")
    // console.log(Math.random().toString(36).substring(2, 6).toUpperCase())
}


// ---- Server ----
function startGame(){
    console.log("GAME SHOULD HAVE STARTED")
    socket = io.connect('http://localhost:8000');
    socketConnections(socket);
    socket.emit('joinGame', "Username");
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
        //data = {player: player, enemies: visableEnemies}
        print(data)
        
    });

    // -- Handle error --
    socket.on('connect_failed', function () {
        socket.close();
    });

    socket.on('disconnect', function () {
        socket.close();
    });
}

// ---- Game Logic ----

// -- Loops --
function loop() {
    loopHandler = window.requestAnimFrame(loop);
    gameLoop();
}

function gameLoop(){
    socket.emit('update-server', {'target' : player.target, 'keypress' : keypress});
}

// -- Username Valid Functions --
function checkUsername(){
    var username = document.getElementById('username').value;
    if (username.length > 16){
        document.getElementById('errorCharacterLimit').style.display = 'block';
        document.getElementById('errorEmptyUsername').style.display = 'none';
    } else if (username.length == 0){
        document.getElementById('errorCharacterLimit').style.display = 'none';
        document.getElementById('errorEmptyUsername').style.display = 'block';
    } else {
        document.getElementById('errorCharacterLimit').style.display = 'none';
        document.getElementById('errorEmptyUsername').style.display = 'none';
        player.username = username;
        return 1;
    }
    return -1;
}

