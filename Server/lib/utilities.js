// Random Color
exports.randomColor = function() {
    var color = '#' + ('00000' + (Math.random() * (1 << 24) | 0).toString(16)).slice(-6);
    return color;
};

// Random Color
exports.makeLobbyCode = function(lobbyCode) {
    code = Math.random().toString(36).substring(2, 6).toUpperCase();
    while (lobbyCode.includes(code)){
        code = Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    return code
};

// Hash function
exports.hash = function(s) {
    for(let i = 0, h = 0; i < s.length; i++)
        h = Math.imul(31, h) + s.charCodeAt(i) | 0;

    return h;
}

//Random Location on map
exports.randomLocation = function(mapWidth, mapHeight) {
    var rWidth = Math.random()
    var rHeight = Math.random()
    var width = (rWidth*(mapWidth*0.90))+((1-rWidth)*(mapWidth*0.10));
    var height = (rHeight*(mapHeight*0.90))+((1-rHeight)*(mapHeight*0.10));
    return {x: Math.floor(width), y: Math.floor(height)}
}

//Get chunk from position
exports.getChunk = function(position, worldChunk){
    var xChunk = Math.floor(position.x/32) + worldChunk/2
    var yChunk = Math.floor(position.y/32) + worldChunk/2
    return {x: xChunk, y: yChunk}
}
