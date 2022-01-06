#version 300 es
precision highp float;

in vec2 a_Vertex;

out vec2 UV;

uniform float aspect;

void main() {
    UV = a_Vertex;
    UV.y *= aspect;
    gl_Position = vec4(a_Vertex, 0.0, 1.0);
}