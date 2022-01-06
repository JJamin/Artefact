#version 300 es
precision highp float;

// Configuration
#define MAP_SIZE 2048.0 // Unit
#define UNIT 8. // Pixel

in vec2 a_Vertex;

out vec2 UV;
out vec2 Position;

uniform vec2 frame;
uniform vec2 camera;


void main() {
    UV = a_Vertex*vec2(0.5, -0.5 *frame.y/frame.x)+0.5;

    // Calculate real coordinates    
    Position = UV * frame.x/UNIT;
    vec2 offset = (camera*vec2(1.,-1.)) - frame.x/UNIT/2.;
    Position += round(offset*8.)*1./8.;

    // Calculate texture UV coordinates
    UV = (Position+((MAP_SIZE)/2.)) / frame.x/UNIT*2.5;

    gl_Position = vec4(a_Vertex, -1.0, 1.0);
}