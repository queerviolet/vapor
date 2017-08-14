//
#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: simplex = require(../node_modules/glsl-noise/simplex/3d)

uniform sampler2D uState;
uniform sampler2D uTarget;
uniform float uTime;
uniform float uGravity;

const vec3 OFFSET = vec3(2399.24849823098, 3299.9028381, 389.09338327);

void main() {
  vec4 sampled = texture2D(uState, gl_FragCoord.xy / vec2(512.0)).rgba;
  vec4 behavior = texture2D(uTarget, gl_FragCoord.xy / vec2(512.0)); 
  vec3 target = behavior.xyz;
  float turbulence = behavior.w;

  vec3 nextPosition = sampled.xyz;

  float t = uTime * 0.013849829389;
  // float t = uTime;

  nextPosition += vec3(
      simplex(vec3(nextPosition.xy * 0.005, 9280.03992092039 + t + gl_FragCoord.x / 110.0) + OFFSET)
    , simplex(vec3(nextPosition.xz * 0.005, 3870.73392092039 - t - gl_FragCoord.y / 110.0) + OFFSET)
    , simplex(vec3(nextPosition.zy * 0.005, 3870.73392092039 - t - gl_FragCoord.y / 110.0) + OFFSET)
  ) * turbulence;

  // Circular current:
  //  
  // float radius = length(nextPosition);
  // float rad = 0.00002 * radius;
  //
  // nextPosition = vec2(
  //     nextPosition.x * cos(rad) - nextPosition.y * sin(rad)
  //   , nextPosition.y * cos(rad) + nextPosition.x * sin(rad)
  // );
  
  // Momentum:
  // nextPosition += lastVelocity * 0.0;
  
  // The spring connects us to the target:
  vec3 goal = target - nextPosition;
  
  // A force that falls off with the inverse square of distance:  
  float dist = length(goal) / 8.0;
  vec3 attraction = uGravity * goal * pow(dist, -0.7);
  nextPosition += attraction;

  // Debugging:
  // nextPosition = uTarget;

  // An attractive spring force:
  vec3 springForce = 0.05 * goal;
  nextPosition += springForce;
  
  // "Gravity", sticking them all together.
  // nextPosition *= 0.99;

  // nextPosition = nextPosition * 0.9 + uTarget;

  // vec2 velocity = nextPosition - sampled.xy;

  // Debug
  // nextPosition = target;

  // vec3 velocity = springForce + attraction;
  gl_FragColor = vec4(nextPosition.xy, 100.0 + nextPosition.z * 0.1, 1.0);
  // gl_FragColor = vec4(gl_FragCoord.xy, 1.0, 1.0);
}