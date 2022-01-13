const requestImg = (url) => new Promise((resolve) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.src = `/static/img/${url}.png`
})
async function downloadImgBatch(directory,type,names,action) {
    return new Promise(resolve => {
        var remaining = names.length
        names.forEach(name => {
            var request = new Image()
            request.onload = ()=>{
                action(name,request)
                if (--remaining == 0) resolve()
            }
            request.src = `${directory}${name}${type}`
        })
    })
}
async function downloadFileBatch(directory,type,names,action) {
    return new Promise(resolve => {
        var remaining = names.length
        names.forEach(name => {
            var request = new XMLHttpRequest()
            request.addEventListener("load", (data)=>{
                action(name,request.response)
                if (--remaining == 0) resolve()
            })
            request.open('GET', `${directory}${name}${type}`)
            request.send()
        })
    })
}
function createTexture(img) {
    let texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    // Scaling parameters
    setTextureWrapMode("clamp")
    setTextureScaleMode("pixel")
    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    return texture
}
function setTextureScaleMode(mode) {
    if ("pixel"==mode) {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    } else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    }
}
function setTextureWrapMode(mode) {
    switch (mode) {
        case "repeat":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
            break;
        case "mirror":
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)
            break;
        default: // clamp
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
            break;
    }
}
class FlatProgram {
    // Create a new program
    constructor(vertCode, fragCode, target) {
        gl.useProgram(null)

        this.program = gl.createProgram()
        this.target = target
        
        // Compile shaders
        const vertShader = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vertShader, vertCode)
        gl.compileShader(vertShader)
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fragShader, fragCode)
        gl.compileShader(fragShader)
        
        // Attach shaders
        gl.attachShader(this.program, vertShader)
        gl.attachShader(this.program, fragShader)
        gl.linkProgram(this.program)
        gl.useProgram(this.program)
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        // gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LESS);
        // gl.clear(gl.DEPTH_BUFFER_BIT)

        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        
        // Upload render triangles
        const Verticies = new Float32Array([-1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 1.0 ])
        this.vertexBuffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, Verticies, gl.STATIC_DRAW)
        this.positionAttribLocation = gl.getAttribLocation(this.program, "a_Vertex")
        gl.vertexAttribPointer( this.positionAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0 )
        gl.enableVertexAttribArray(this.positionAttribLocation)

        // Generate uniform setters
        this.setUniform = {}
        this.uLocation = {}
        let uniformArgs = (vertCode+fragCode).matchAll("uniform +(.+) +(.+);")
        for (let i of uniformArgs) {
            let location = gl.getUniformLocation(this.program, i[2])
            this.uLocation[i[2]] = location
            let setFuncName = "uniform"
            if (! ["sampler2D"].includes(i[1])) {
                switch (i[1]) {
                    case "int": setFuncName += "1i"; break;
                    case "float": setFuncName += "1f"; break;
                    case "vec2": setFuncName += "2fv"; break;
                    case "vec3": setFuncName += "3fv"; break;
                    case "vec4": setFuncName += "4fv"; break;
                    case "mat2": setFuncName += "Matrix2fv"; break;
                    case "mat3": setFuncName += "Matrix3fv"; break;
                    case "mat4": setFuncName += "Matrix4fv"; break;
                    default: alert("Unsupported uniform type"); break;
                }
                if (i[1].substr(0,3) == 'mat') {
                    // Matrix uniform
                    this.setUniform[i[2]] = (value)=>{
                        gl.useProgram(this.program)
                        gl[setFuncName](location, false, value)
                    }
                } else {
                    // Regular uniform
                    this.setUniform[i[2]] = (value)=>{
                        gl.useProgram(this.program)
                        gl[setFuncName](location, value)
                    }
                }
            }
        }

        // Check errors
        gl.useProgram(this.program)
        if (gl.getError() != 0) {
            // Append error message to HTML body
            const message = 'Error creating program'
            document.body.innerHTML += `
                <div id="error">${message}</div>
                <style>
                    #error {
                        position: absolute; padding: 16px; top: 0; left: 0; right: 0; font-size: 16px; background: red; color: white;
                    }
                </style>
            `
            alert("Error")
        }

        gl.viewport(0, 0, this.target.w, this.target.h)

    }
    // Draw frame
    draw() {
        gl.drawArrays(gl.TRIANGLES, 0, 6)
    }
    use() {
        gl.useProgram(this.program)
    }
    prepareDraw() {
        gl.useProgram(this.program)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.target.buffer)
        
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
        gl.vertexAttribPointer( this.positionAttribLocation, 2, gl.FLOAT, gl.FALSE, 2 * Float32Array.BYTES_PER_ELEMENT, 0 )

        gl.viewport(0, 0, this.target.w, this.target.h)
    }
    clear() {
        gl.clear(gl.COLOR_BUFFER_BIT)
    }
}
class MeshProgram {
    // Create a new program
    constructor(vertCode, fragCode, target) {
        gl.useProgram(null)

        this.program = gl.createProgram()
        this.target = target
        
        // Compile shaders
        const vertShader = gl.createShader(gl.VERTEX_SHADER)
        gl.shaderSource(vertShader, vertCode)
        gl.compileShader(vertShader)
        const fragShader = gl.createShader(gl.FRAGMENT_SHADER)
        gl.shaderSource(fragShader, fragCode)
        gl.compileShader(fragShader)
        
        // Attach shaders
        gl.attachShader(this.program, vertShader)
        gl.attachShader(this.program, fragShader)
        gl.linkProgram(this.program)
        gl.useProgram(this.program)
        gl.clearColor( 1.0, 1.0, 1.0, 1.0)
        // gl.enable(gl.DEPTH_TEST);
        // gl.depthFunc(gl.LESS);

        // gl.enable(gl.BLEND);
        // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        // gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        
        // Configure attributes
        this.positionAttribLocation = gl.getAttribLocation(this.program, "a_Vertex")
        this.colorAttribLocation = gl.getAttribLocation(this.program, "a_Color")
        gl.vertexAttribPointer( this.positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 0 )
        gl.vertexAttribPointer( this.colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT )
        gl.enableVertexAttribArray(this.positionAttribLocation)
        gl.enableVertexAttribArray(this.colorAttribLocation)

        // Generate uniform setters
        this.setUniform = {}
        this.uLocation = {}
        let uniformArgs = (vertCode+fragCode).matchAll("uniform +(.+) +(.+);")
        for (let i of uniformArgs) {
            let location = gl.getUniformLocation(this.program, i[2])
            this.uLocation[i[2]] = location
            let setFuncName = "uniform"
            if (! ["sampler2D"].includes(i[1])) {
                switch (i[1]) {
                    case "int": setFuncName += "1i"; break;
                    case "float": setFuncName += "1f"; break;
                    case "vec2": setFuncName += "2fv"; break;
                    case "vec3": setFuncName += "3fv"; break;
                    case "vec4": setFuncName += "4fv"; break;
                    case "mat2": setFuncName += "Matrix2fv"; break;
                    case "mat3": setFuncName += "Matrix3fv"; break;
                    case "mat4": setFuncName += "Matrix4fv"; break;
                    default: alert("Unsupported uniform type"); break;
                }
                if (i[1].substr(0,3) == 'mat') {
                    // Matrix uniform
                    this.setUniform[i[2]] = (value)=>{
                        gl.useProgram(this.program)
                        gl[setFuncName](location, false, value)
                    }
                } else {
                    // Regular uniform
                    this.setUniform[i[2]] = (value)=>{
                        gl.useProgram(this.program)
                        gl[setFuncName](location, value)
                    }
                }
            }
        }

        // Check errors
        gl.useProgram(this.program)
        if (gl.getError() != 0) {
            const message = 'Error creating program'
            document.body.innerHTML += `
                <div id="error">${message}</div>
                <style>
                    #error {
                        position: absolute; padding: 16px; top: 0; left: 0; right: 0; font-size: 16px; background: red; color: white;
                    }
                </style>
            `
            alert("Error")
        }

        gl.viewport(0, 0, this.target.w, this.target.h)

    }
    // Draw frame
    draw(mesh) {
        mesh.bindBuffers()

        gl.vertexAttribPointer( this.positionAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 0 )
        gl.vertexAttribPointer( this.colorAttribLocation, 3, gl.FLOAT, gl.FALSE, 6 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT )
        
        gl.drawElements(gl.TRIANGLES, mesh.triangleCount, gl.UNSIGNED_SHORT, 0)
    }
    use() {
        gl.useProgram(this.program)
    }
    prepareDraw() {
        gl.useProgram(this.program)
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.target.buffer)
        gl.viewport(0, 0, this.target.w, this.target.h)
    }
    clear() {
        gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)
        // gl.clear(gl.COLOR_BUFFER_BIT)
    }
}
class FrameBuffer {
    constructor(w, h) {
        this.w = w
        this.h = h

        // Create color texture
        // gl.activeTexture(gl.TEXTURE0)
        this.texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const level = 0;
        const border = 0;
        {
            const internalFormat = gl.RGBA;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            const data = null;
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, this.w, this.h, border, format, type, data);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        }

        this.buffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);        
        const colorAttachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, colorAttachmentPoint, gl.TEXTURE_2D, this.texture, level);

        // Create depth texture
        const depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);

        {
            // define size and format of level 0
            const internalFormat = gl.DEPTH_COMPONENT24;
            const format = gl.DEPTH_COMPONENT;
            const type = gl.UNSIGNED_INT;
            const data = null;
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                            this.w, this.h,  border,
                            format, type, data);
            
            // set the filtering so we don't need mips
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
            // attach the depth texture to the framebuffer
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, level);
        }

        gl.clearColor(0.63, 0.30, 0.33, 1.0);
        // gl.clearDepth(1.0);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // gl.depthMask(true);
        // gl.depthFunc(gl.LESS)
    }
}
class DepthFrameBuffer {
    constructor(w, h) {
        this.w = w
        this.h = h

        // Create color texture
        // gl.activeTexture(gl.TEXTURE0)
        this.texture = gl.createTexture()
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const level = 0;
        const border = 0;
        {
            const internalFormat = gl.RGBA;
            const format = gl.RGBA;
            const type = gl.UNSIGNED_BYTE;
            const data = null;
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, this.w, this.h, border, format, type, data);
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
            // gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
        }

        this.buffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);        
        const colorAttachmentPoint = gl.COLOR_ATTACHMENT0;
        gl.framebufferTexture2D(gl.FRAMEBUFFER, colorAttachmentPoint, gl.TEXTURE_2D, this.texture, level);

        // Create depth texture
        const depthTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, depthTexture);

        {
            // define size and format of level 0
            const internalFormat = gl.DEPTH_COMPONENT24;
            const format = gl.DEPTH_COMPONENT;
            const type = gl.UNSIGNED_INT;
            const data = null;
            gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                            this.w, this.h,  border,
                            format, type, data);
            
            // set the filtering so we don't need mips
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            
            // attach the depth texture to the framebuffer
            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depthTexture, level);
        }

        gl.clearColor(0.63, 0.30, 0.33, 1.0);
        // gl.clearDepth(1.0);
        // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // gl.depthMask(true);
        // gl.depthFunc(gl.LESS)
    }
}
class Mesh {
    constructor(data){
        // Expects data={verts:[vertlist],faces:[facelist]}
        
        // Save verticies
        this.vertBuffer = gl.createBuffer()
        this.verts = new Float32Array(data.verts)
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer)
        gl.bufferData(gl.ARRAY_BUFFER, this.verts, gl.STATIC_DRAW)

        // Save faces
        this.faceBuffer = gl.createBuffer()
        this.faces = new Uint16Array(data.faces)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceBuffer)
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.faces, gl.STATIC_DRAW)

        this.triangleCount = this.faces.length

    }
    bindBuffers() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceBuffer)
    }
}
