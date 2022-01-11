#version 300 es
precision highp float;

// Configuration
#define GRID false
// Constants
#define MAP_SIZE 2048.0 // Unit
#define UNIT 8. // Pixel
#define pi 3.1415926535

// Colors
#define C_BROWN_4 vec3(.89, .63, .52)
#define C_BROWN_3 vec3(.78, .45, .41)
#define C_BROWN_2 vec3(.63, .30, .33)
#define C_GREEN_1 vec3(.27, .32, .38)
#define C_CYAN_5 vec3(.31, .40, .47)


// in vec3 Color;
in vec3 Position;

out vec4 fragColor;



const uint k = 1103515245U;
vec3 hash( uvec3 x ) {
    x = ((x>>8U)^x.yzx)*k;
    x = ((x>>8U)^x.yzx)*k;
    x = ((x>>8U)^x.yzx)*k;
    
    return vec3(x)*(1.0/float(0xffffffffU));
}

float noise(vec2 p) {
    float val = 0.;
    ivec2 ip = ivec2(round(p));

    for (int ix=-1; ix<2; ++ix) {
        for (int iy=-1; iy<2; ++iy) {
            vec2 origin = vec2(ip+ivec2(ix,iy));
            vec3 rand = hash(uvec3(origin,1.));
            vec2 offset = p - (origin + (rand.xy-0.5));
            val += smoothstep(1., 0., length( offset ));
    
        }
    }
    return val;
}

// Main
void main() {
    vec3 color = vec3(C_BROWN_3);

    vec3 pRand = hash(uvec3(Position*8.));
    vec3 tRand = hash(uvec3(Position));
    
    float n1 = noise(Position.xy*1./32.);
    n1 -= 0.02*noise(Position.xy*2.)*noise(Position.xy*1./32.);
    bool speckle = 0. < smoothstep(2.5, 4., noise(Position.xy*1./1.));

    if (n1 > 1.) {
        if (!speckle) {
            color = mix(color, C_BROWN_4, 0.5);
        }
    } else {
        if (speckle) {
            color = mix(color, C_BROWN_4, 0.5);
        }
    }
    // if (tRand.x > 0.9) {
    //     color = C_BROWN_4;
    // }

    if (GRID) {
        vec2 guv1 = floor(Position.xy * 1./32. );
        vec2 guv2 = floor(Position.xy );
        float c1 = mod(guv1.x + guv1.y, 2.);
        float c2 = mod(guv2.x + guv2.y, 2.);
        color = mix(color, color*1.05, c2);
        color = mix(color, color*1.1, c1);
    }

    fragColor = vec4(color, 1.0);
}

// #version 300 es
// precision highp float;

// // Configuration
// #define GRID true
// // Constants
// #define MAP_SIZE 2048.0 // Unit
// #define UNIT 8. // Pixel

// // Colors
// #define C_BROWN_3 vec3(.78, .45, .41)
// #define C_BROWN_4 vec3(.63, .30, .33)
// #define C_CYAN_5 vec3(.31, .40, .47)


// out vec4 fragColor;

// in vec3 Vertex;
// in vec3 Color;

// in vec2 UV;
// in vec2 Position;

// uniform sampler2D map;
// uniform vec2 frame;

// #define pi 3.1415926535



// void main() {
//     vec4 color = vec4(.0, .2, 0., 1.);

//     ivec2 pixel = ivec2(Position*UNIT);

//     vec3 h1u = hash(uvec3(Position+MAP_SIZE, 1.));
//     vec3 h1p = hash(uvec3((Position+MAP_SIZE)*UNIT, 1.));
//     // vec4 neighbor = texelFetch(map, ivec2(Position+MAP_SIZE/2.), 0);
//     // vec4 neighbor = texelFetch(map, ivec2(Position+MAP_SIZE/2.), 0);
//     // vec4 map = texelFetch(map, ivec2(Position+MAP_SIZE/2.), 0);

//     // vec4 map = texture(map, UV);
//     // vec4 dust = texelFetch(map, ivec2(0,0), 0);
//     // vec4 dust = texelFetch(map, ivec2(1,0), 0);
//     // vec4 dust = texelFetch(map, ivec2(Position+MAP_SIZE/2. + h1p.xy*2.), 0);

//     // vec3 h1 = hash(uvec3(UV*111111111.7, 1));
    

//     vec4 tile = vec4(0.);//map;
//     if (tile.r == 0.) {
//         if (tile.g > 0.) {
//             // Grass land
//             color.rgb = mix(C_BROWN_3, C_BROWN_4, smoothstep(0.99,1.,h1p.x));
//         } else {
//             // Dirt
//             color.rgb = mix(C_BROWN_4, C_BROWN_3, smoothstep(0.99,1.,h1p.x));
//         }
//     } else {
//         color.rgb *= 0.;
//     }


//     // color.rgb += h1u*0.02;
//     // color.rgb += smoothstep(0.9,1.,h1p)*0.1;;


//     if (GRID) {
//         color.g += smoothstep(.995, 1., fract(-Position.x*1./32.) );
//         color.g += smoothstep(.995, 1., fract(Position.y*1./32.) );
//         color += smoothstep(1.,.99,length(Position));
//         // if (map.b >= 1.) {
//         //     color.rgb += 0.5;
//         // }
//     }

//     fragColor = color;

// }