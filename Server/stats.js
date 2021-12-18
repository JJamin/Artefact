var util = require('./lib/utilities');

tickRate = 60
worldChunk = 64

//Enum for types
const type = {
	player: 0,
	enemy: 1,
    ability: 2,
    object: 3
}

const skillTree = {
    "a":new Set(["b","c","o"]),
    "b":new Set(["a","c"]),
    "c":new Set(["a","d","s"]),
    "d":new Set(["c","e"]),
    "e":new Set(["d","f"]),
    "f":new Set(["e","g","h"]),
    "g":new Set(["f","h","r"]),
    "h":new Set(["g","f","i"]),
    "i":new Set(["h","j"]),
    "j":new Set(["i","k"]),
    "k":new Set(["j","p","m","l"]),
    "l":new Set(["m","k"]),
    "m":new Set(["n","l","k"]),
    "n":new Set(["m","o"]),
    "o":new Set(["a","n"]),
    "p":new Set(["q","k"]),
    "q":new Set(["s","p","r"]),
    "r":new Set(["q","g"]),
    "s":new Set(["q","c"]),
}

exports.st = {
    "class":{
        "Cowboy":{
            ability1: "b",
            ability2: "a",
            ability3: "c"
        },
        "Wizard":{
            ability1: "f",
            ability2: "h",
            ability3: "g"
        },
        "Brute":{
            ability1: "l",
            ability2: "k",
            ability3: "m"
        }
    },

    "skill":{
        "f":{
            "stats":{
                health: 1,
                speed: 1,
                cooldown: 1
            },
            "run": function (player, world, abilities){
                // createProjectile(world, player, abilities, player.direction, 30, 0.5, "g", dashPlayer, removeAbility)
            }
        },
        "g":{
            "stats":{
                health: 1,
                speed: 1,
                cooldown: 3
            },
            "run": function (player, world, abilities){
                clearFunction = clearPlayer
                dashPlayer(player, player.direction, 12, 0.1, true, true, clearFunction)
                //send event to client
            }
        },
        "h":{

        }
    }
}

function dashPlayer(player, dir, dist, time, hidden, invulnerable, clearFunc){
    player.moveable = false
    player.hidden = hidden
    player.invulnerable = invulnerable

    if (time == 0){
        player.position.x += -(dist*Math.sin(dir.dir))
        player.position.y += (dist*Math.cos(dir.dir))

        player.runningAbilities.push([0, clearFunc])
    } else {
        player.velocity.x = -(dist*Math.sin(dir.dir))/(tickRate*time)
        player.velocity.y = (dist*Math.cos(dir.dir))/(tickRate*time)

        player.runningAbilities.push([(time*tickRate)-1, clearFunc, [player], type.player])
    }
}

function clearPlayer(params){
    params[0] = player
    params[0].moveable = true
    params[0].hidden = false
    params[0].invulnerable = false

    params[0].velocity.x = 0
    params[0].velocity.y = 0
}

function dwProjectile(world, player, abilities, dir, dist, time, label, activationFunc, clearFunc){

    var ability = {
        id: util.makeID(),
        player: player,
        position: Object.assign({}, player.position),
        label: label,
        velocity: {x: 0, y: 0},
        direction: {x:0, y:0, dir: dir},
        activationFunc: activationFunc,
        currentChunk: util.getChunk(player.position, worldChunk),
        hidden: false
    };

    if (time == 0){
        ability.position.x += -(dist*Math.sin(dir.dir))
        ability.position.y += (dist*Math.cos(dir.dir))

        player.runningAbilities.push([0, clearFunc])
    } else {
        ability.velocity.x = -(dist*Math.sin(dir.dir))/(tickRate*time)
        ability.velocity.y = (dist*Math.cos(dir.dir))/(tickRate*time)

        player.runningAbilities.push([(time*tickRate)-1, clearFunc, [ability, abilities, world], type.ability])
    }


    abilities[ability.id] = ability
    world[ability.currentChunk.y][ability.currentChunk.x][ability.id] = [type.ability, ability]
}

function removeAbility(params){
    //ability = params[0]; abilities = params[1]; world = params[2]
    delete params[1][params[0].id]
    delete params[2][params[0].currentChunk.y][params[0].currentChunk.x][params[0].id]
}