//Import
var util = require('./lib/utilities');

//Variables
var maxScreenWidth = 160;
var maxScreenHeight = 160;
var worldChunk = 64;

var players = {}; //[PlayerID] -> Player
var world = [];
for(var i=0; i<worldChunk; ++i) {
    world.push([]);
    for(var j=0; j<worldChunk; ++j) {
        world[i].push({});
    }
}

//Enum for types
const type = {
	player: 0,
	enemy: 1,
    ability: 2,
    object: 3
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
        position: util.randomLocation(0, 0),
        movementSpeed: 0.35,
        direction: {x:0, y:0, dir: 0},
        abilitiesUnlocked: [],
        activeAbilities: ["","",""],
        abilityCD: [0,0,0],
        capeColor: util.randomColor(),
        velocity: {x: 0, y: 0},
        health: 100,
        currentChunk: {x:0, y:0}
    };
    return player
}

function createNode(node, type){
    var newNode = {
        id: node.id,
        type: type,
        x: node.position.x,
        y: node.position.y,
        dir: node.direction.dir
    };
    return newNode
}

function killPlayer(playerID){
    //add drops and what not TODO
    //TODO DEADLOCK
    delete players[playerID];
}

//Get Recieve messages sent from the Main Server
process.on('message', (msg) => {

    if (msg['type'] == 'addPlayer') {
        //TODO DEADLOCK THIS PORTION
        //msg = [playerID, playerUsername]
        players[msg['message'][0]] = createNewPlayer(msg['message'][0],msg['message'][1]);
        var chunk = util.getChunk(players[msg['message'][0]].position, worldChunk)
        players[msg['message'][0]].currentChunk = chunk
        world[chunk.y][chunk.x][msg['message'][0]] = [type.player, players[msg['message'][0]]]

        //In the future, set their starter abilities in the info send too. TODO
        newPlayerInfo = {}
        newPlayerInfo[msg['message'][0]] = {username: msg['message'][1], 
                                                     capeColor: players[msg['message'][0]].capeColor,
                                                     abilitiesUnlocked: [],
                                                     activeAbilities: ["","",""],
                                                     abilityCD: [0,0,0]
                                            }
        process.send(sendInfo(msg['message'][0], 'update-client-playerInfo', newPlayerInfo));
        //TODO DEADLOCK THIS PORTION
    }

    if (msg['type'] == 'removePlayer') {
        //msg = ''
        killPlayer(msg['playerID']);
    }
    
    if (msg['type'] == 'update-server') {
        //msg = {direction: {string}}
        //TODO DEADLOCK
        players[msg['playerID']].direction = msg['message'];
    }
});

//What to send to the clients
function sendClientPos(){
    for (var playerID in players){
        var nodes = {};
        var player = players[playerID];

        nodes[playerID] = createNode(player, type.player)
        for (let y = player.currentChunk.y-2; y <= player.currentChunk.y+2; ++y){
            if (y < 0 || y >=64){continue}
            for (let x = player.currentChunk.x-2; x <= player.currentChunk.x+2; ++x){
                if (x < 0 || x >= 64){continue}
                for (let id in world[y][x]){
                    if (id == playerID){ continue }
                    if (world[y][x][id][0] == type.player){
                        nodes[id] = createNode(world[y][x][id][1], type.enemy)
                    }
                }
            }
        }
        process.send(sendInfo(player.id, 'update-client-nodes', nodes));
    }
}

//Game Functions dw
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
    //Move Player
    player.velocity = newPlayerVelocity(player.direction,player.velocity)
    newPosx = player.position.x + player.velocity.x * player.movementSpeed
    newPosy = player.position.y + player.velocity.y * player.movementSpeed
    if (newPosx < worldChunk*16 && newPosx > -worldChunk*16){
        player.position.x = newPosx
    }
    if (newPosy < worldChunk*16 && newPosy > -worldChunk*16){
        player.position.y = newPosy
    }

    var newChunk = util.getChunk(player.position, worldChunk)
    if (player.currentChunk != newChunk){
        delete world[player.currentChunk.y][player.currentChunk.x][player.id]
        world[newChunk.y][newChunk.x][player.id] = [type.player, player]
        player.currentChunk = newChunk
    }
}

function newPlayerVelocity(direction, velocity){

    if (direction.x == 0 && velocity.x != 0){
        if (velocity.x < 0){
            velocity.x += 0.08
            if (velocity.x > 0){velocity.x = 0}
        } else {
            velocity.x -= 0.08
            if (velocity.x < 0){velocity.x = 0}
        }
    } else {
        velocity.x += 0.25*direction.x
        if (velocity.x > 1){
            velocity.x = 1
        }
        if (velocity.x < -1){
            velocity.x = -1
        }
    }

    if (direction.y == 0 && velocity.y != 0){
        if (velocity.y < 0){
            velocity.y += 0.08
            if (velocity.y > 0){velocity.y = 0}
        } else {
            velocity.y -= 0.08
            if (velocity.y < 0){velocity.y = 0}
        }
    } else {
        velocity.y += 0.25*direction.y
        if (velocity.y > 1){
            velocity.y = 1
        }
        if (velocity.y < -1){
            velocity.y = -1
        }
    }

    var speed = Math.sqrt(velocity.y**2 + velocity.x**2)
    if (speed > 1){
        velocity.y /= speed
        velocity.x /= speed
    }
    return velocity
}

setInterval(gameLoop, 1000 / 60);
setInterval(sendClientPos, 1000 / 40);

