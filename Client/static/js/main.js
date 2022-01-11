'use strict';

const RESOLUTION = window.devicePixelRatio
const ASPECT = 0.75 // height/width
const UNIT = 8 // pixels
const CHUNK_SIZE = 32 // units
const MAP_SIZE = 64 // chunks
const VIEW_WIDTH = 2.5 // chunks 

const PI = Math.PI
var gl
const M = Math
const G = {} // Global game object

var FILE = {shader:{},texture:{},mesh:{},sound:{}}

const REQUIRED = {
    shader: ['terrain.vert','terrain.frag','view.vert','view.frag','mesh.vert','mesh.frag'],
    // img: ['map','terrain'] // .png
    mesh: ['floor','player','grass0','tree0']
} 

function load() {
    G.run = false
    G.up = vec3.fromValues(0, 0, 1)
    G.view = document.getElementById('view');
    G.renderData = {mesh:{},sprite:{}}
    gl = G.view.getContext("webgl2", {antialias: false, preserveDrawingBuffer: true, premultipliedAlpha: false })
    
    // Download required files
    const requests = [
        downloadFileBatch(`http://${CONFIG.uri}/static/shader/`, '', REQUIRED.shader, (name,data)=>{
            FILE.shader[name] = data
        }),
        // downloadImgBatch(`http://${CONFIG.uri}/static/img/`, '.png', REQUIRED.img, (name,img)=>{
        //     FILE.texture[name] = createTexture(img)
        // }),
        downloadFileBatch(`http://${CONFIG.uri}/static/model/`, '.json', REQUIRED.mesh, (name,data)=>{
            FILE.mesh[name] = new Mesh( JSON.parse(data) )
        }),
    ]
    let t0 = performance.now()
    Promise.all(requests).then(()=>{
        init()
        t0 = performance.now() - t0
        console.log(`Required assets loaded (${(t0*0.001).toFixed(2)}s)`)
    })

}
function init() {
    if ('ontouchstart' in window) {
        CONFIG.touchEnabled = true
    }

    // UI Events
    window.addEventListener('resize',resize)
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('mousemove', mouseMove)
    G.view.addEventListener('contextmenu',(e)=>{ // Prevent right-click context menu
        e.preventDefault()
        return false
    })
    window.addEventListener('mousedown', (e)=>{
        if (e.button == 1)
            abilityCast.add(1)
        else if (e.button == 3)
            abilityCast.add(2)
    })

    // Compute render targets
    G.target = {}
    // Set render targets
    G.target.scene = {
        w: Math.ceil( UNIT * CHUNK_SIZE * VIEW_WIDTH ),
        h: Math.ceil( UNIT * CHUNK_SIZE * VIEW_WIDTH * ASPECT ),
        buffer: null
    }
    G.target.view = {
        w: Math.ceil(window.innerWidth * RESOLUTION),
        h: Math.ceil(window.innerHeight * RESOLUTION),
        buffer: null
    }

    // Create render Programs
    G.prog = {}
    G.prog.terrain = new MeshProgram(
        FILE.shader['terrain.vert'],
        FILE.shader['terrain.frag'],
        G.target.scene
    )

    G.prog.mesh = new MeshProgram(
        FILE.shader['mesh.vert'],
        FILE.shader['mesh.frag'],
        G.target.scene
    )

    G.prog.view = new FlatProgram(
        FILE.shader['view.vert'],
        FILE.shader['view.frag'],
        G.target.view
    )

    // Create frame buffers
    G.fb = {}
    G.fb.scene = new FrameBuffer(G.target.scene.w, G.target.scene.h)
    G.target.scene.buffer = G.fb.scene.buffer

    layout()

    G.nodes = {}
    G.autoNode = new Set()  // Track automatically created nodes from model, so they can be automatically deleted
    G.player = {} // Player Node
    G.profile = {}
    G.ready = false // Minimum resources required to operate met
    G.camera = {
        p: vec3.fromValues(0, -2, 2),
        viewMatrix: mat4.create(),
        update:()=>{
            let projMat = mat4.create()
            let lookMat = mat4.create()
            // mat4.ortho(projMat, G.target.scene.w*-0.5, G.target.scene.w*0.5, G.target.scene.h*-0.5, G.target.scene.h*0.5, 0.01, 128)
            // mat4.ortho(projMat, -1, 1, -1, 1, 0, 128)
            vec3.add(G.camera.p, vec3.fromValues(controls.mx * 16, -64, 64 - controls.my * 16), G.player.p)
            mat4.ortho(projMat, -G.target.scene.w/2/UNIT, G.target.scene.w/2/UNIT, -G.target.scene.h/2/UNIT, G.target.scene.h/2/UNIT, 0, 256)
            mat4.lookAt(lookMat, G.camera.p, G.player.pv, G.up)
            mat4.mul(G.camera.viewMatrix, projMat, lookMat)
        }
    }
    

    // Connect to server
    connect()

    // Wait for sufficient world information
    let checkIfModelLoaded = ()=>{
        if (G.ready ) {
            // Link player and begin game render loop
            console.log('Start')
            start()

        } else {
            setTimeout(checkIfModelLoaded, 100)
        }
    }

    // Set the G.player variable
    console.log("Waiting for info...")
    checkIfModelLoaded()

    // Debug visuals
    let testNode = {
        id: "_test",
        format: Format.mesh,
        mesh: "test",
        p: vec3.create(),
        r: vec3.create(),
        s: vec3.fromValues(1,1,1),
        update: ()=>{}
    }
    addNode(testNode)

    // Tree
    let tree = {
        id: "_tree",
        format: Format.mesh,
        mesh: "tree0",
        p: vec3.create(),
        r: vec3.create(),
        s: vec3.fromValues(1,1,1),
        update: ()=>{}
    }
    tree.p[0] = 8
    addNode(tree)

    // Trees
    for (let i=0; i<500; ++i) {
        let n = {
            id: `_tree${i}`,
            format: Format.mesh,
            mesh: "tree0",
            p: vec3.create(),
            r: vec3.create(),
            s: vec3.fromValues(1,1,1),
            update: ()=>{}
        }
        n.r[2] = (Math.random()-.5) * 180
        n.p[0] = (Math.random()-0.5) * MAP_SIZE * CHUNK_SIZE
        n.p[1] = (Math.random()-0.5) * MAP_SIZE * CHUNK_SIZE
        n.s[2] = .75 + Math.random()*.5
        // n.r[2] = Math.random()*360
        addNode(n)
    }

    // Grass
    for (let i=0; i<1_000; ++i) {
        let n = {
            id: `_grass${i}`,
            format: Format.mesh,
            mesh: "grass0",
            p: vec3.create(),
            r: vec3.create(),
            s: vec3.fromValues(1,1,1),
            update: ()=>{}
        }
        n.p[0] = (Math.random()-0.5) * MAP_SIZE * CHUNK_SIZE
        n.p[1] = (Math.random()-0.5) * MAP_SIZE * CHUNK_SIZE
        n.s[2] = .25 + Math.random()*2
        // n.r[2] = Math.random()*360
        addNode(n)
    }

}

var T = 0
function start() {
    G.run = true
    requestAnimationFrame(frame)
}
function stop() { G.run = false }
function frame() {
    T = performance.now()

    // Cursor direction
    dir = -Math.atan(controls.mx/controls.my)
    if (controls.my < 0 ) dir += Math.PI

    // Notify server of key updates
    if (updateKey) {
        SendDataToServer()
    }
    // Notify server of ability cast attempts
    if (abilityCast.size > 0) {
        for (let ability of abilityCast) {
            switch (ability) {
                case 1: socket.emit('update-server-ability1',{}); break;
                case 2: socket.emit('update-server-ability2',{}); break;
                case 3: socket.emit('update-server-ability3',{}); break;
                default: break;
            }
        }
        abilityCast.clear()
    }

    // Update nodes
    updateNodes()

    // Camera
    G.camera.update()

    // Draw scene
    renderScene()

    if (G.run) requestAnimationFrame(frame)

}
function renderScene() {

    // Render floor
    G.prog.terrain.prepareDraw()
    G.prog.terrain.clear()
    G.prog.terrain.setUniform['u_View']( G.camera.viewMatrix )
    let floor = FILE.mesh['floor']
    G.prog.terrain.draw(floor)


    // Draw meshes
    G.prog.mesh.prepareDraw()
    gl.enable(gl.DEPTH_TEST)
    G.prog.mesh.setUniform['u_View']( G.camera.viewMatrix )
    // G.prog.mesh.setUniform['u_View']( G.cam.matrix )
    for (let nodeID in G.renderData.mesh) {
        let node = G.nodes[nodeID]
        let mesh = FILE.mesh[node.mesh]
        // Determine if mesh should be culled (not in screen space)
        let offcenterness = {
            x: M.abs( G.player.pv[0] - node.p[0] ),
            y: M.abs( G.player.pv[1] - node.p[1] ),
        } 
        if (mesh != null && offcenterness.x < VIEW_WIDTH*0.68*CHUNK_SIZE && offcenterness.y < VIEW_WIDTH*0.68*CHUNK_SIZE) {
            // Generate transform matricies
            let transformMatrix = mat4.create()
            let rotation = quat.create()
            quat.fromEuler(rotation, node.r[0], node.r[1], node.r[2])
            mat4.fromRotationTranslationScale(transformMatrix, rotation, node.p, node.s)
            G.prog.mesh.setUniform['u_Transform']( transformMatrix )
    
            // Draw
            G.prog.mesh.draw(mesh)

        }
    }
    gl.disable(gl.DEPTH_TEST)


    // Render upscaled scene
    G.prog.view.prepareDraw()
    // G.prog.view.setUniform['aspect']( [controls.mx, controls.my] )
    G.prog.view.setUniform['aspect']( G.target.view.h / G.target.view.w * 1.0 )
    gl.bindTexture(gl.TEXTURE_2D, G.fb.scene.texture)
    G.prog.view.draw()


}
function layout() {
    // Set targets
    G.target.scene.w = Math.ceil( UNIT * CHUNK_SIZE * VIEW_WIDTH )
    G.target.scene.h = Math.ceil( UNIT * CHUNK_SIZE * VIEW_WIDTH * ASPECT ),// Math.ceil( UNIT * CHUNK_SIZE * VIEW_WIDTH )
    G.target.view.w = Math.ceil(window.innerWidth * RESOLUTION)
    G.target.view.h = Math.ceil(window.innerHeight * RESOLUTION)
    
    // Adjust canvas
    G.view.width = G.target.view.w
    G.view.height = G.target.view.h
    // Update uniforms
    if (G.prog != null) {
        G.prog.terrain.setUniform['frame']([G.target.scene.w, G.target.scene.h])
        G.prog.view.setUniform['frame']([G.target.scene.w, G.target.scene.h])
    }
    G.fb.scene = new FrameBuffer(G.target.scene.w, G.target.scene.h)
    G.target.scene.buffer = G.fb.scene.buffer

}
// Nodes have been updated
function syncNodes() {

    // Debug printing
    if (Object.keys(Model.abilities).length > 0) {
        console.log(Model.abilities)
    }
    if (Object.keys(Model.events).length > 0) {
        console.log(Model.abilities)
    }

    // Link player node
    if (!G.ready) {
        if (G.profile && G.nodes[G.profile.id] != null) {
            G.player = G.nodes[G.profile.id]
            G.ready = true
        }
    }

    // Find node discrepancies
    let stale = new Set(Object.keys(G.nodes))
    for (let nodeID in Model.nodes) {
        stale.delete(nodeID)
        if (nodeID in G.nodes) {
            // Node already exists

        } else {
            // Create new node
            let node = Model.nodes[nodeID]
            G.autoNode.add(nodeID)
            addNode( createNode(node) )
        }
    }
    // Remove stale nodes
    for (let nodeID of stale) {
        if (G.autoNode.has(nodeID)) {
            G.autoNode.delete(nodeID)
            delete G.nodes[nodeID]
            delete G.renderData.mesh[nodeID]
            delete G.renderData.sprite[nodeID]
        }
    }

}
// Create a renderable node object based on model node
function createNode(node) {
    return ENTITY[node.type].create(node)
}
// Add node object to render objects
function addNode(node) {
    G.nodes[node.id] = node
    if (node.format == Format.mesh) {
        G.renderData.mesh[node.id] = node
    } else {
        G.renderData.sprite[node.id] = node
    }
    if (node.id == G.profile.id) G.player = G.nodes[node.id]
}
// Call the update function on all nodes
function updateNodes() {
    G.player.r[2] = dir * 180/3.14159
    for (let nodeID in Model.nodes) {
        let node = G.nodes[nodeID]
        node.update(node, Model.nodes[nodeID])
    }
}
// Returns random integer from 0 to upperBound inclusive
function randInt(upperBound) {
    return Math.round(Math.random()*upperBound)
}
function resize() {
    layout()
}
// Helpers
function downloadFiles(directory,type,names,action,callback) {
    var remaining = names.length
    names.forEach(name => {
        var request = new XMLHttpRequest()
        request.addEventListener("load", (data)=>{
            action(name,request.response)
            if (--remaining == 0) callback()
        })
        request.open('GET', `${directory}${name}.${type}`)
        request.send()
    })
}

//
//  Controls
//
var dir = 0
var controls = {x:0,y:0,mx:1,my:1}
var keys = {w:false,a:false,s:false,d:false}
var abilityCast = new Set()
var updateKey = false
function keyDown(e) {
    switch (e.keyCode) {
        case 32: abilityCast.add(3); break;
        case 87: updateKey = true; keys.w = true; controls.y = 1.0; break;
        case 83: updateKey = true; keys.s = true; controls.y =-1.0; break;
        case 68: updateKey = true; keys.d = true; controls.x = 1.0; break;
        case 65: updateKey = true; keys.a = true; controls.x =-1.0; break;
        default: break;
    }
    return false
}
function keyUp(e) {
    switch (e.keyCode) {
        case 87: updateKey = true; keys.w = false; if (controls.y == 1.0) if (keys.s) controls.y =-1.0; else controls.y = 0.0; break;
        case 83: updateKey = true; keys.s = false; if (controls.y ==-1.0) if (keys.w) controls.y = 1.0; else controls.y = 0.0; break;
        case 68: updateKey = true; keys.d = false; if (controls.x == 1.0) if (keys.a) controls.x =-1.0; else controls.x = 0.0; break;
        case 65: updateKey = true; keys.a = false; if (controls.x ==-1.0) if (keys.d) controls.x = 1.0; else controls.x = 0.0; break;
        default: break;
    }
    return false
}
function mouseMove(e) { 
    controls.mx = ((e.clientX/window.innerWidth) * 1.0) - 0.5
    controls.my = ((e.clientY/window.innerHeight) * -1.0) + 0.5
}
