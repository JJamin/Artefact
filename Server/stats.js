// var util = require('./lib/utilities');

// const uid = function(){
//     return Date.now().toString(36) + Math.random().toString(36).substr(2);
// }

// tickRate = 60
// worldChunk = 64

// // //Enum for types
// // const type = {
// // 	player: 0,
// // 	enemy: 1,
// //     ability: 2,
// //     object: 3
// // }

// function createNewAbility(abilityID, playerID, type, duration, position){
//     var ability = {
//         id: abilityID,
//         playerID: playerID,
//         type: type,
//         duration: duration*tickrate,
//         position: position,
//         time: 0
//     }

//     return ability
// }

// const skillTree = {
//     "a":new Set(["b","c","o"]),
//     "b":new Set(["a","c"]),
//     "c":new Set(["a","d","s"]),
//     "d":new Set(["c","e"]),
//     "e":new Set(["d","f"]),
//     "f":new Set(["e","g","h"]),
//     "g":new Set(["f","h","r"]),
//     "h":new Set(["g","f","i"]),
//     "i":new Set(["h","j"]),
//     "j":new Set(["i","k"]),
//     "k":new Set(["j","p","m","l"]),
//     "l":new Set(["m","k"]),
//     "m":new Set(["n","l","k"]),
//     "n":new Set(["m","o"]),
//     "o":new Set(["a","n"]),
//     "p":new Set(["q","k"]),
//     "q":new Set(["s","p","r"]),
//     "r":new Set(["q","g"]),
//     "s":new Set(["q","c"]),
// }

// exports.st = {
//     "class":{
//         "Cowboy":{
//             ability1: "b",
//             ability2: "a",
//             ability3: "c"
//         },
//         "Wizard":{
//             ability1: "f",
//             ability2: "h",
//             ability3: "g"
//         },
//         "Brute":{
//             ability1: "l",
//             ability2: "k",
//             ability3: "m"
//         }
//     },

//     "skill":{
//         "f":{
//             "stats":{
//                 health: 1,
//                 speed: 1,
//                 cooldown: 1
//             },
//             "run": function (player, world, abilities){
//                 // createProjectile(world, player, abilities, player.direction, 30, 0.5, "g", dashPlayer, removeAbility)
//             }
//         },
//         "g":{
//             "stats":{
//                 health: 1,
//                 speed: 1,
//                 cooldown: 3,

//                 dist: 12,
//                 duration: 0.1
//             },
//             "run": function (player, world, abilityBuffer, abilityPos){
//                 player.abilityCD[abilityPos] = st["skill"]["g"]["stats"][cooldown] * tickRate
//                 player.moveable -= 1
//                 player.hidden += 1
//                 player.invulnerable += 1
//                 player.runningAbilities[uid()] = createNewAbility(player.ID, "g", 0.1, null)
//             },
//             "clear": function (player, world, ability){
//                 player.moveable += 1
//                 player.hidden -= 1
//                 player.invulnerable -= 1

//                 player.velocity.x = 0
//                 player.velocity.y = 0

//                 delete player.runningAbilities[ability.id]
//             },
//             "hit": function (player, world, abilityBuffer, ability){
//                 //no hit function for g ability
//             },

//             "loop": function (player, world, ability){
//                 if (ability.time >= ability.duration){
//                     st["skill"]["g"]["stats"][clear](player, world, abilityBuffer, ability)
//                 } else {
//                     ability.time += 1
//                     dashPlayer(player, st["skill"]["g"]["stats"]["dist"], st["skill"]["g"]["time"])
//                 }   
//             }
//         },
//         "h":{

//         }
//     }
// }

// function dashPlayer(player, dist, time){
//     player.position.x += -((dist/(time*tickRate))*Math.sin(player.direction.dir))
//     player.position.y += ((dist/(time*tickRate))*Math.cos(player.direction.dir))
// }