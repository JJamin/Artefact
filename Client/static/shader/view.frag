#version 300 es
precision highp float;

out vec4 fragColor;

in vec2 UV;

uniform sampler2D scene;
uniform vec2 frame;

void main() {
    vec4 color = vec4(0., 0., 0., 1.);

    color.rgb = texture(scene, UV*vec2(0.5, 0.5*frame.x/frame.y)+0.5).rgb;
    vec2 absUV = abs( UV*vec2(0.5, 0.5*frame.x/frame.y) );
    if (max(absUV.x,absUV.y) > .5) {
        color.rgb = vec3(0.);
    }

    fragColor = color;

}