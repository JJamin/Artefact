const SCALE = 2
const CHUNK_SIZE = 32
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
    camera = new THREE.OrthographicCamera( view.width / -16, view.width / 16, view.height / 16, view.height / -16, 0, 256 );
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
        for (var i = 0; i<32; ++i) {
            const tex = G.textureLoader.load(`/static/img/rock${randInt(1)}.png`);  
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            const mat = new THREE.SpriteMaterial( { map: tex } );
            const rock = new THREE.Sprite( mat );
            // rock.rotation.x = 0.5
            rock.position.x = Math.random() * 32*3 - 16*3
            rock.position.y = Math.random() * 32*3 - 16*3
            rock.position.z = 0.5
            rock.scale.x = 2.0 // 1/SCALE*2.0// 0.5 //tex.image.width //* PREF.scale
            // rock.scale.y = 1/SCALE*2.0//0.5 //tex.image.width //* PREF.scale
            G.scene.add( rock )
        }
    }

    {
        let chunk = addChunk(G.scene)
    }

    { // Random grass
        for (ix = -32; ix <= 32; ix += 1) {
            for (iy = -32; iy <= 32; iy += 1) {
                
                if (simplex3(ix*0.1, iy*0.1, 0) > 0 ) {

                    let sprite = addSprite(G.scene,`grass${randInt(2)}`, ix, iy)

                }

            }
        }
        // for (var i = 0; i<256; ++i) {
        //     const tex = G.textureLoader.load(`/static/img/grass${randInt(2)}.png`);  
        //     tex.magFilter = THREE.NearestFilter;
        //     tex.minFilter = THREE.NearestFilter;
        //     const mat = new THREE.SpriteMaterial( { map: tex } );
        //     const rock = new THREE.Sprite( mat );
        //     // rock.rotation.x = 0.5
        //     rock.position.x = Math.random() * 32 - 16
        //     rock.position.x += simplex3(rock.position.x*0.2, rock.position.y*0.2, 0) * 1.0
        //     rock.position.y = Math.random() * 32 - 16
        //     rock.position.y += simplex3(rock.position.x*0.2, 0, -rock.position.y*0.2) * 1.0
        //     rock.position.z = 0.5
        //     rock.scale.x = 2.0
        //     rock.scale.y = 2.0
        //     // rock.scale.y = 1/SCALE*2.0//0.5 //tex.image.width //* PREF.scale
        //     G.scene.add( rock )
        // }
    }

    var grid = new THREE.GridHelper(32, 32, colorCenterLine=0xDCDAC9, colorGrid=0xE7AD8B);
    G.grid = grid
    grid.rotation.x = Math.PI/2
    grid.position.z = -0.01
    G.scene.add(grid);

    var majorGrid = new THREE.GridHelper(64, 64, colorCenterLine=0xDCDAC9, colorGrid=0xE7AD8B);
    majorGrid.rotation.x = Math.PI/2
    majorGrid.position.z = -0.01
    majorGrid.scale.set(32,32,32)
    G.scene.add(majorGrid);


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
        if ("player" in G) {
            run = true
            frame()
        } else {
            setTimeout(findPlayer, 100)
        }
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

    G.grid.position.x = Math.round((G.player.position.x+CHUNK_SIZE*0.5)/CHUNK_SIZE)*CHUNK_SIZE - CHUNK_SIZE*0.5
    G.grid.position.y = Math.round((G.player.position.y+CHUNK_SIZE*0.5)/CHUNK_SIZE)*CHUNK_SIZE - CHUNK_SIZE*0.5

    // Cursor direction
    dir = -Math.atan(controls.mx/controls.my)
    if (controls.my < 0 ) dir += Math.PI

    // Point player with cursor directionw
    // G.nodes.player.rotation.z = dir

    // Camera positioning
    viewVector.set(0,1,0)
    viewVector.applyAxisAngle( xAxis, controls.my*0.12 - 0.62 );
    viewVector.applyAxisAngle( zAxis, controls.mx*0.24 );
    let camPos = G.player.position.clone()
    viewVector.multiplyScalar(128.0)
    camPos.sub(viewVector)
    camera.position.set( camPos.x, camPos.y, camPos.z)
    camera.lookAt(G.player.position)

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
        node.rotation.z = target.dir
    }
}
// Returns random integer from 0 to upperBound inclusive
function randInt(upperBound) {
    return Math.round(Math.random()*upperBound)
}
var textureCache = {}
function addChunk(container,x,y) {
    let chunk = new THREE.Group()

}
function addSprite(container, img, x, y) {
    G.textureLoader.load(`/static/img/${img}.png`,( texture )=>{
        let node = new THREE.Group()

        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        let mat = new THREE.SpriteMaterial( { map: texture } );
        let sprite = new THREE.Sprite( mat );

        const width = texture.image.width
        const height = texture.image.height

        sprite.scale.x = width/UNIT
        sprite.scale.y = height/UNIT
        sprite.position.y = height/UNIT * 0.5
        sprite.position.z = 0.5

        node.position.set(x,y,0)
        node.add(sprite)

        container.add(node)

    },undefined,function ( err ) {
		console.error( 'ERROR loading image '+img );
    });  
    
    
    // tex.magFilter = THREE.NearestFilter;
    // tex.minFilter = THREE.NearestFilter;
    // const mat = new THREE.SpriteMaterial( { map: tex } );
    // const node = new THREE.Sprite( mat );
    // // rock.rotation.x = 0.5
    // rock.position.x = Math.random() * 32 - 16
    // rock.position.x += simplex3(rock.position.x*0.2, rock.position.y*0.2, 0) * 1.0
    // rock.position.y = Math.random() * 32 - 16
    // rock.position.y += simplex3(rock.position.x*0.2, 0, -rock.position.y*0.2) * 1.0
    // rock.position.z = 0.5
    // rock.scale.x = 2.0
    // rock.scale.y = 2.0
    // // rock.scale.y = 1/SCALE*2.0//0.5 //tex.image.width //* PREF.scale
    // G.scene.add( rock )
}
function syncNodes() {
    // console.log("SYNC")
    let stale = new Set(Object.keys(G.nodes))
    for (let nodeID in model.nodes) {
        stale.delete(nodeID)
        node = model.nodes[nodeID]
        if (nodeID in G.nodes) {
            // Node already exists
        } else {
            // Create new node
            console.log("create new node")
            G.nodes[nodeID] = CreateMesh.player()
            G.nodes[nodeID].position.x = node.x
            G.nodes[nodeID].position.y = node.y
            G.scene.add(G.nodes[nodeID])
            if (node.type == 0) {
                console.log("Player ID",nodeID)
                G.player = G.nodes[nodeID]
            }
        }
    }
    if (stale.size > 0) {
        console.log("TRASH!")
    }
    for (let nodeID of stale) {
        G.scene.remove(G.nodes[nodeID])
        delete G.nodes[nodeID]
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

// NOISE FUNCTION

function Grad(x, y, z) {
    this.x = x; this.y = y; this.z = z;
}

Grad.prototype.dot2 = function(x, y) {
return this.x*x + this.y*y;
};

Grad.prototype.dot3 = function(x, y, z) {
return this.x*x + this.y*y + this.z*z;
};

var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
            new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
            new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

var p = [151,160,137,91,90,15,
131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
// To remove the need for index wrapping, double the permutation table length
var perm = new Array(512);
var gradP = new Array(512);

// This isn't a very good seeding function, but it works ok. It supports 2^16
// different seed values. Write something better if you need more seeds.
seed = function(seed) {
    if(seed > 0 && seed < 1) {
        // Scale the seed out
        seed *= 65536;
    }

    for(var i = 0; i < 256; i++) {
        var v;
        if (i & 1) {
        v = p[i] ^ (seed & 255);
        } else {
        v = p[i] ^ ((seed>>8) & 255);
        }

        perm[i] = perm[i + 256] = v;
        gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
};

seed(0);
const F2 = 0.5*(Math.sqrt(3)-1);
const G2 = (3-Math.sqrt(3))/6;
const F3 = 1/3;
const G3 = 1/6;
function simplex3(xin, yin, zin) {
    var n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin+zin)*F3; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var k = Math.floor(zin+s);

    var t = (i+j+k)*G3;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    var z0 = zin-k+t;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if(x0 >= y0) {
      if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    var x1 = x0 - i1 + G3; // Offsets for second corner
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;

    var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
    var y2 = y0 - j2 + 2 * G3;
    var z2 = z0 - k2 + 2 * G3;

    var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
    var y3 = y0 - 1 + 3 * G3;
    var z3 = z0 - 1 + 3 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    i &= 255;
    j &= 255;
    k &= 255;
    var gi0 = gradP[i+   perm[j+   perm[k   ]]];
    var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
    var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
    var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];

    // Calculate the contribution from the four corners
    var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if(t3<0) {
      n3 = 0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);

  };