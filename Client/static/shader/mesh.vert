#version 300 es
precision highp float;

in vec3 a_Vertex;
in vec3 a_Color;

out vec3 Color;

uniform mat4 u_View;
uniform mat4 u_Transform;

void main() {
    Color = a_Color;
    gl_Position = u_View * u_Transform * vec4(a_Vertex, 1.0);
}