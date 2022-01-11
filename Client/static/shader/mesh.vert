#version 300 es
precision highp float;

in vec3 a_Vertex;
in vec3 a_Color;

out vec3 Color;

uniform float u_T;
uniform mat4 u_View;
uniform mat4 u_Transform;

void main() {
    Color = a_Color;
    vec4 position = u_View * u_Transform * vec4(a_Vertex, 1.0);
    
    bool green = a_Color.g > max(a_Color.r, a_Color.b);
    if (green && a_Vertex.z > -.01) {
        position.xyz += 0.004*vec3(sin(-0.6*u_T*(2.+0.5*sin(-0.5*u_T))+position.y*4.+position.x*3.),
                                   sin(-0.6*u_T*(1.2+0.3*sin(0.3*u_T))+position.x*2.),
                                   0.);
        // position.xyz += 0.002*vec3(cos(-u_T*(.4+0.2*cos(-u_T))+position.y*4.), 0., 0.);
    }

    gl_Position = position;
}