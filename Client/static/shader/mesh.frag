#version 300 es
precision lowp float;

in vec3 Color;

out vec4 fragColor;

void main() {
    fragColor = vec4(Color, 1.0);
}
