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
const float SPEED = 16.0;

void main() {
  vec4 sampled = texture2D(uState, gl_FragCoord.xy / vec2(512.0)).rgba;
  vec4 targetParams = texture2D(uTarget, gl_FragCoord.xy / vec2(512.0)); 
  vec2 target = targetParams.xy;
  float turbulence = targetParams.z;
  // vec2 target = vec2(0.0, 0.0);

                // vec2(0.0, texture2D(uTarget, vec2(0.0, 0.0)).a);
  vec2 nextPosition = sampled.xy;
  vec2 lastVelocity = sampled.zw;

  float t = uTime * 0.013849829389;
  // float t = uTime;

  nextPosition += vec2(
      simplex(vec3(nextPosition * 0.005, 9280.03992092039 + t + gl_FragCoord.x / 110.0) + OFFSET)
    , simplex(vec3(nextPosition * 0.005, 3870.73392092039 - t - gl_FragCoord.y / 110.0) + OFFSET)
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
  nextPosition += lastVelocity * 0.0;
  
  // The spring connects us to the target:
  vec2 goal;
  goal = target - nextPosition;
  
  // A force that falls off with the inverse square of distance:  
  float dist = length(goal) / 8.0;
  vec2 attraction = uGravity * goal * pow(dist, -0.7);
  nextPosition += attraction;

  // Debugging:
  // nextPosition = uTarget;

  // An attractive spring force:
  vec2 springForce = 0.05 * goal;
  nextPosition += springForce;
  
  // "Gravity", sticking them all together.
  // nextPosition *= 0.99;

  // nextPosition = nextPosition * 0.9 + uTarget;

  // vec2 velocity = nextPosition - sampled.xy;

  // Debug
  // nextPosition = target;

  vec2 velocity = springForce + attraction;
  gl_FragColor = vec4(vec3(nextPosition, velocity.x), velocity.y);
  // gl_FragColor = vec4(gl_FragCoord.xy, 1.0, 1.0);
}
