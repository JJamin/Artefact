//Import
var util = require('./lib/utilities');

//Variables
var players = {}; //[PlayerID] -> Player
var maxScreenWidth = 16;
var maxScreenHeight = 16;
var gamestate = "ingame"; //States: ingame, skillTree, settings

//Enum for types
const type = {
	player: 0,
	enemy: 1,
}

//helper functions
function sendInfo(p, t, m){
    return ({playerID : p, 
            type : t, 
            message : m});
}

function createNewPlayer(playerID, playerUsername){
    var player = {
        id: playerID,
        username: playerUsername,
        position: util.randomLocation(1024, 1024),
        target: {
            x: 0,
            y: 0
        },
        movementSpeed: 1,
        keypress: {},
        abilitiesUnlocked: [],
        activeAbilities: ["","",""],
        abilityCD: [0,0,0],
        capeColor: util.randomColor(),
        velocity: {x: 0, y: 0}
    };
    return player
}

function createNode(node, type){
    var newNode = {
        id: node.id,
        type: type,
        x: node.position.x,
        y: node.position.y,
    };
    return newNode
}

function killPlayer(playerID){
    //add drops and what not TODO
    delete players[playerID];
}

//Get Recieve messages sent from the Main Server
process.on('message', (msg) => {

    if (msg['type'] == 'addPlayer') {
        //msg = [playerID, playerUsername]
        players[msg['message'][0]] = createNewPlayer(msg['message'][0],msg['message'][1]);
    }

    if (msg['type'] == 'removePlayer') {
        //msg = ''
        killPlayer(msg['playerID']);
    }
    
    if (msg['type'] == 'update-server') {
        //msg = {target: {x: int, y: int}, keypress: {string}}
        players[msg['playerID']].target = msg['message']['target'];
        players[msg['playerID']].keypress = msg['message']['keypress'];
    }
});

//What to send to the clients
function sendClientPos(){
    for (var playerID in players){
        var nodes = [];
        var player = players[playerID];

        nodes.push(createNode(player, type.player))
        nodes.concat(Object.values(players)
            .filter(function(enemy){
            if (enemy.x > player.x - maxScreenWidth/2 - 5 &&
                enemy.x < player.x + maxScreenWidth/2 - 5 &&
                enemy.y > player.y - maxScreenHeight/2 - 5 &&
                enemy.y < player.y + maxScreenHeight/2 - 5 &&
                enemy.id != player.id){
                    return createNode(enemy, type.enemy)
            }
        }));

        process.send(sendInfo(player.id, 'update-client-nodes', {nodes: nodes}));
    }
}

//Game Functions 
function gameLoop(){
    for (var playerID in players){
        var player = players[playerID];
        tickPlayer(player)
    }
}

//Update players cooldowns and movements
function tickPlayer(player){
    movePlayer(player)
}

function movePlayer(player){
    player.velocity = newPlayerVelocity(player.keypress,player.velocity)
    player.x += player.velocity * player.movementSpeed
    player.y += player.velocity * player.movementSpeed
    return player
}

function newPlayerVelocity(keypress, velocity){
    //W Key Pressed
    if (keypress.w){
        if (velocity.y >= 0.8){
            velocity.y = 1
        } else {
            velocity.y += 0.3
        }
    }
    //D Key Pressed
    if (keypress.d){
        if (velocity.x >= 0.8){
            velocity.x = 1
        } else {
            velocity.x += 0.3
        }
    }
    //S Key Pressed
    if (keypress.s){
        if (velocity.y <= -0.8){
            velocity.y = -1
        } else {
            velocity.y -= 0.3
        }
    }
    //A Key Pressed
    if (keypress.a){
        if (velocity.x <= -0.8){
            velocity.x = -1
        } else {
            velocity.x -= 0.3
        }
    }
    return velocity
}

setInterval(gameLoop, 1000 / 60);
setInterval(sendClientPos, 1000 / 40);

