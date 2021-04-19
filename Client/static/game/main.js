const SCALE = 2
const UNIT = 8
var SOURCE = {
    img:{},
    sound:{}
}
var run = false 
var camera, renderer, controls
var rtTexture, upscaleCamera, upscaleScene
var G = {}
const view = {}
const xAxis = new THREE.Vector3( 1, 0, 0 );
const yAxis = new THREE.Vector3( 0, 1, 0 );
const zAxis = new THREE.Vector3( 0, 0, 1 );
function init() {
    window.addEventListener('keydown', keyDown)
    window.addEventListener('keyup', keyUp)
    window.addEventListener('mousemove', mouseMove)

    view.canvas = document.getElementById('view');
    renderer = new THREE.WebGLRenderer({canvas:view.canvas});
    renderer.autoClear = false;
    // renderer.setPixelRatio(window.devicePixelRatio)

    setScale()

    const near = 0.1;
    const far = 1024;
    let unit = 8;
    camera = new THREE.OrthographicCamera( view.width / -16, view.width / 16, view.height / 16, view.height / -16, -128, 512 );
    // camera = new THREE.PerspectiveCamera(fov=10, window.innerWidth / window.innerHeight, near, far);
    camera.up.set( 0, 0, 1 )
    camera.position.z = 24;
    camera.position.y = -16; // Determines tilt angle
    camera.rotation.x = Math.PI * 0.12
    // camera.lookAt(0,0,0)
    
    // Pixelated upscale processing
    upscaleCamera = new THREE.OrthographicCamera( window.innerWidth / -2, window.innerWidth / 2, window.innerHeight / 2, window.innerHeight / -2, -128, 128 );
    upscaleCamera.position.z = 1;
    upscaleScene = new THREE.Scene();
    rtTexture = new THREE.WebGLRenderTarget( 
        window.innerWidth/SCALE, //resolution x
        window.innerHeight/SCALE, //resolution y
        {
            minFilter: THREE.LinearFilter, 
            magFilter: THREE.NearestFilter, 
            format: THREE.RGBFormat 
        }
    );
    const upscaleVertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `
    const upscaleFragShader = `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    void main() {
        gl_FragColor = texture2D( tDiffuse, vUv );

    }`
    let materialScreen = new THREE.ShaderMaterial( {

        uniforms: { tDiffuse: { value: rtTexture.texture } },
        vertexShader: upscaleVertexShader,
        fragmentShader: upscaleFragShader,
        depthWrite: false

    });
    let plane = new THREE.PlaneGeometry( window.innerWidth, window.innerHeight );
                // plane to display rendered texture
				quad = new THREE.Mesh( plane, materialScreen );
				quad.position.z = - 100;
				upscaleScene.add( quad );

    G.scene = new THREE.Scene();
    G.scene.background = new THREE.Color( 0xE3A084 );
    G.textureLoader = new THREE.TextureLoader()

    // Initialize objects in scene
    
    G.nodes = {}
    // G.nodes.player = new THREE.Group()
    // G.nodes.player = CreateMesh.player(capeColor=0x5C8BA8)

    // { // Build player
        
    //     // Shadow
    //     mat = new THREE.MeshBasicMaterial({color: 0xC77369})
    //     let shadow = new THREE.Mesh(new THREE.CircleGeometry( 0.7, 12 ), mat);
    //     // head.position.z = 0.62 + body.position.z
    //     G.nodes.player.add( shadow )

    // }
    // G.scene.add(G.nodes.player);

    { // Random rocks
        const tex = G.textureLoader.load('/static/img/rock.png');  
        tex.magFilter = THREE.NearestFilter;
        tex.minFilter = THREE.NearestFilter;
        const mat = new THREE.SpriteMaterial( { map: tex } );
        for (var i = 0; i<32; ++i) {
            const rock = new THREE.Sprite( mat );
            // rock.rotation.x = 0.5
            rock.position.x = Math.random() * 128 - 64
            rock.position.y = Math.random() * 128 - 64
            rock.position.z = 0.5
            // rock.scale.x = 1/SCALE*2.0// 0.5 //tex.image.width //* PREF.scale
            // rock.scale.y = 1/SCALE*2.0//0.5 //tex.image.width //* PREF.scale
            G.scene.add( rock )
        }
    }

    var grid = new THREE.GridHelper(32, 32, colorCenterLine=0xDCDAC9, colorGrid=0xE7AD8B);
    G.grid = grid
    grid.rotation.x = Math.PI/2
    grid.position.z = -0.01
    G.scene.add(grid);


    // var sun = new THREE.DirectionalLight( 0xffffff );
    // sun.position.set( 1, -1, 1 ).normalize();
    // G.scene.add(sun);

    window.addEventListener('resize',resize)
    
    // Update camera projection matrix
    setCamera()

    // Begin world sync
    connect()

    // Wait for sufficient world information
    let findPlayer = ()=>{
        if ("player" in G.nodes) {
            run = true
            frame()
        } else {
            setTimeout(findPlayer, 100)
        }

        // G.player = 
        // run = true
        // frame()
        
    }

    findPlayer()

}
var viewVector = new THREE.Vector3( 0, 1, 0 );

var T = 0
var dir = 0
// const RAD = Math.PI / 2;
function frame() {
    T = performance.now()

    // Update nodes
    animateNodes()

    // Cursor direction
    dir = -Math.atan(controls.mx/controls.my)
    if (controls.my < 0 ) dir += Math.PI

    // Point player with cursor directionw
    // G.nodes.player.rotation.z = dir

    // Camera positioning
    viewVector.set(0,1,0)
    viewVector.applyAxisAngle( xAxis, controls.my*0.12 - 0.62 );
    viewVector.applyAxisAngle( zAxis, controls.mx*0.24 );
    let camPos = G.nodes.player.position.clone()
    viewVector.multiplyScalar(128.0)
    camPos.sub(viewVector)
    camera.position.set( camPos.x, camPos.y, camPos.z)
    camera.lookAt(G.nodes.player.position)

    // Notify server of key updates
    if (updateKey) {
        SendDataToServer()
    }

    // Draw scene
    renderScene()

    if (run) requestAnimationFrame(frame)

}
function animateNodes() {
    for (let nodeID in model.nodes) {
        let target = model.nodes[nodeID]
        node = G.nodes[nodeID]
        node.position.x += (target.x - G.nodes[nodeID].position.x ) * 0.8
        node.position.y += (target.y - G.nodes[nodeID].position.y ) * 0.8
    }
}
function syncNodes() {
    for (let nodeID in model.nodes) {
        node = model.nodes[nodeID]
        if (nodeID in G.nodes) {
            // Node exists
            // G.nodes[nodeID].position.x += (node.x - G.nodes[nodeID].position.x ) * 0.8
            // G.nodes[nodeID].position.y += (node.y - G.nodes[nodeID].position.y ) * 0.8

        } else {
            // Create new node
            console.log("create new node")
            G.nodes[nodeID] = CreateMesh.player()
            G.nodes[nodeID].position.x = node.x
            G.nodes[nodeID].position.y = node.y
            G.scene.add(G.nodes[nodeID])
            if (node.type == 0) {
                G.nodes.player = G.nodes[nodeID]
            }

        }
    }
}
function renderScene() {
    // Render small scale scene
    renderer.setRenderTarget( rtTexture );
    renderer.clear();
    renderer.render(G.scene, camera)
    // Render full screen quad with generated texture
    renderer.setRenderTarget( null );
    renderer.clear();
    renderer.render( upscaleScene, upscaleCamera );
}
function setScale() {
    view.zoom = 1.0
    view.viewWidth = window.innerWidth//*window.devicePixelRatio
    view.viewHeight = window.innerHeight//*window.devicePixelRatio
    view.width = Math.ceil(window.innerWidth / SCALE)
    view.height = Math.ceil(window.innerHeight / SCALE)
}
function setCamera() {
    camera.aspect =  view.width / view.height
    camera.updateProjectionMatrix();
    renderer.setSize( view.viewWidth, view.viewHeight )
}
function layout () {
    width = window.innerWidth
    height = window.innerHeight
    camera.aspect =  width / height
    camera.updateProjectionMatrix();
    renderer.setSize( width, height )
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
var keys = {w:false,a:false,s:false,d:false}
var updateKey = false
function keyDown(e) {
    switch (e.keyCode) {
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
var controls = {x:0,y:0,mx:1,my:1}
function mouseMove(e) { 
    controls.mx = ((e.clientX/window.innerWidth) * 1.0) - 0.5
    controls.my = ((e.clientY/window.innerHeight) * -1.0) + 0.5
}