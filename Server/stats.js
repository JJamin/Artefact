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

const st = {
    class:{
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

    skill:{
        "g":{
            health: 1,
            speed: 1,
            cooldown: 3
        }
    }
}