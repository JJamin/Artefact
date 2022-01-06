#version 300 es
precision highp float;

// Configuration
#define GRID false
//
#define MAP_SIZE 2048.0 // Unit
#define UNIT 8. // Pixel

// Colors
#define C_BROWN_3 vec3(.78, .45, .41)
#define C_BROWN_4 vec3(.63, .30, .33)
#define C_CYAN_5 vec3(.31, .40, .47)


out vec4 fragColor;

in vec2 UV;
in vec2 Position;

uniform sampler2D map;
uniform vec2 frame;

#define pi 3.1415926535

const uint k = 1103515245U;  // GLIB C
//const uint k = 134775813U;   // Delphi and Turbo Pascal
//const uint k = 20170906U;    // Today's date (use three days ago's dateif you want a prime)
//const uint k = 1664525U;     // Numerical Recipes
vec3 hash( uvec3 x ) {
    x = ((x>>8U)^x.yzx)*k;
    x = ((x>>8U)^x.yzx)*k;
    x = ((x>>8U)^x.yzx)*k;
    
    return vec3(x)*(1.0/float(0xffffffffU));
}

void main() {
    vec4 color = vec4(.0, .2, 0., 1.);

    ivec2 pixel = ivec2(Position*UNIT);

    vec3 h1u = hash(uvec3(Position+MAP_SIZE, 1.));
    vec3 h1p = hash(uvec3((Position+MAP_SIZE)*UNIT, 1.));
    // vec4 neighbor = texelFetch(map, ivec2(Position+MAP_SIZE/2.), 0);
    // vec4 neighbor = texelFetch(map, ivec2(Position+MAP_SIZE/2.), 0);
    // vec4 map = texelFetch(map, ivec2(Position+MAP_SIZE/2.), 0);

    vec4 map = texture(map, UV);
    // vec4 dust = texelFetch(map, ivec2(0,0), 0);
    // vec4 dust = texelFetch(map, ivec2(1,0), 0);
    // vec4 dust = texelFetch(map, ivec2(Position+MAP_SIZE/2. + h1p.xy*2.), 0);

    // vec3 h1 = hash(uvec3(UV*111111111.7, 1));
    

    vec4 tile = map;
    if (tile.r == 0.) {
        if (tile.g > 0.) {
            // Grass land
            color.rgb = mix(C_BROWN_3, C_BROWN_4, smoothstep(0.99,1.,h1p.x));
        } else {
            // Dirt
            color.rgb = mix(C_BROWN_4, C_BROWN_3, smoothstep(0.99,1.,h1p.x));
        }
    } else {
        color.rgb *= 0.;
    }


    // color.rgb += h1u*0.02;
    // color.rgb += smoothstep(0.9,1.,h1p)*0.1;;


    if (GRID) {
        color.g += smoothstep(.995, 1., fract(-Position.x*1./32.) );
        color.g += smoothstep(.995, 1., fract(Position.y*1./32.) );
        color += smoothstep(1.,.99,length(Position));
        if (map.b >= 1.) {
            color.rgb += 0.5;
        }
    }

    fragColor = color;

}