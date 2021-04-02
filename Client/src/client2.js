// -- Variables --
var socket;
var loopHandler;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

// Animation Variables
var transitionPos = 0;
var counter;
var updateText;
var gameTitle;
var gameDescription; 
var elimination;

// Player
var player = {
    id: -1,
    username: "",
    color: '#000',
    x: 0,
    y: 0,
    target: {
        x: 0,
        y: 0
    },
    keypress: {},
    screen: {
        width: screenWidth,
        height: screenHeight
    }
};

let keypress = {};


// -- Canvas --
    var canvas = document.getElementById('canvas');
    canvas.width = screenWidth; canvas.height = screenHeight;
    var graph = canvas.getContext('2d');

// -- Event Listeners --
window.addEventListener('resize', function() {
    canvas.width = screenWidth = window.innerWidth;
    canvas.height = screenHeight = window.innerHeight;
}, true);

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
        return 0;
    }
    return -1;
}

// -- Animations --
function transition(count, update, game, description, isElim){
    counter = count;
    updateText = update;
    gameDescription = description;
    gameTitle = game;
    isElim = elimination;
    transitionLoop();
}

function transitionLoop() {
    if (transitionPos <= 100){
        document.getElementById('transition').style.top = 100-transitionPos + 'vh';
    } else if (transitionPos < 200){
        document.getElementById('transition').style.bottom = transitionPos-100 + 'vh';
    }
    transitionPos += 5;
    if (transitionPos == 100){
        document.getElementById('counter').innerHTML = counter;
        if (elimination){
            document.getElementById('updateText').style.display = 'none';
            document.getElementById('gameTitle').style.display = 'none';
            document.getElementById('gameDescription').style.display = 'none';
            document.getElementById('playerList').style.display = 'block';
        } else {
            document.getElementById('playerList').style.display = 'none';
            if (gameTitle == ''){
                document.getElementById('gameTitle').style.display = 'none';
            } else {
                document.getElementById('gameTitle').style.display = 'block';
                document.getElementById('gameTitle').innerHTML = gameTitle;
            }
            if (updateText == ''){
                document.getElementById('updateText').style.display = 'none';
            } else {
                document.getElementById('updateText').style.display = 'block';
                document.getElementById('updateText').innerHTML = updateText;
            }
            if (gameDescription == ''){
                document.getElementById('gameDescription').style.display = 'none';
            } else {
                document.getElementById('gameDescription').style.display = 'block';
                document.getElementById('gameDescription').innerHTML = gameDescription;
            }
        }
    }
    if (transitionPos == 200){
        document.getElementById('transition').style.top = 100 + 'vh';
        document.getElementById('transition').style.bottom = 0 + 'vh';
    }
    if (transitionPos > 900){
        document.getElementById('updateText').style.opacity = (1000-transitionPos)/100;
        document.getElementById('gameTitle').style.opacity = (1000-transitionPos)/100;
        document.getElementById('gameDescription').style.opacity = (1000-transitionPos)/100;
        document.getElementById('playerList').style.opacity = (1000-transitionPos)/100;
    }
    if (transitionPos < 1000) {
        requestAnimationFrame(transitionLoop);
    } else {
        transitionPos = 0;
        document.getElementById('updateText').style.display = 'none';
        document.getElementById('gameTitle').style.display = 'none';
        document.getElementById('gameDescription').style.display = 'none';
        document.getElementById('playerList').style.opacity = 'none';
        document.getElementById('updateText').style.opacity = 1;
        document.getElementById('gameTitle').style.opacity = 1;
        document.getElementById('gameDescription').style.opacity = 1;
        document.getElementById('playerList').style.opacity = 1;
    }
  }

// -- Buttons --
function publicClicked(){
    if (checkUsername() == -1){return};
    startGame();
}

function privateClicked(){
    if (checkUsername() == -1){return};
}

// -- Key Events --
document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) {
        return;
    }
    keypress[event.key] = "0";
});

document.addEventListener('keyup', function (event) {
    if (event.defaultPrevented || event.isComposing || event.keyCode === 229) {
        return;
    }
    delete keypress[event.key];
});

// ---- Server ----
function startGame(){
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('gamePage').style.display = 'block';

    socket = io.connect('http://localhost:8000');
    socketConnections(socket);
    socket.emit('joinGame', player);
    loop();
}

function socketConnections(socket) {

    // -- Lobby Server Messages --
    socket.on('matchmaking', function (player) {
        self.player.color = player.color;
        self.player.id = player.id;
    });

    //Lobby Updates
    socket.on('playersWaiting', function(lobby){
        socket.emit('test', lobby);
        var col = 0;
        for (var i = 0; i < 5; ++i){
            document.getElementById('pList'+col).innerHTML = '';
        }
        for (var i = 0; i < lobby.length; ++i){
            let li = document.createElement('li');
            if ((lobby[i][1]) == 1){
                li.innerHTML = (lobby[i][0]).strike();
            } else {
                li.innerHTML = lobby[i][0];
            }
            document.getElementById('pList'+col).appendChild(li)
            if ((i+1)%12 == 0){
                ++col;
            }
        }
    });

    socket.on('counter', function(counter){
        document.getElementById('counter').innerHTML = counter;
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

    // -- Drawing --
function drawgrid() {
    graph.lineWidth = 1;
    graph.strokeStyle = '#E4E4E4';
    graph.globalAlpha = 0.1;
    graph.beginPath();

   for (var x = 0; x < screenWidth; x += screenHeight / 18) {
       graph.moveTo(x, 0);
       graph.lineTo(x, screenHeight);
   }

   for (var y = 0; y < screenHeight; y += screenHeight / 18) {
       graph.moveTo(0, y);
       graph.lineTo(screenWidth, y);
   }

   graph.stroke();
}

    // -- Loops --
function loop() {
    loopHandler = window.requestAnimFrame(loop);
    gameLoop();
}

function gameLoop(){
    drawgrid();
    socket.emit('update', {'target' : player.target, 'keypress' : keypress});
}

// -- Function Calls --
