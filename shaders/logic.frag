//
#ifdef GL_ES
precision mediump float;
#endif

#pragma glslify: simplex = require(../node_modules/glsl-noise/simplex/3d)

uniform sampler2D uState;
uniform sampler2D uTarget;
uniform float uTime;
uniform float uGravity;
uniform mat4 uModel;

const vec3 OFFSET = vec3(2399.24849823098, 3299.9028381, 389.09338327);

void main() {
  vec4 sampled = texture2D(uState, gl_FragCoord.xy / vec2(512.0)).rgba;
  vec4 behavior = texture2D(uTarget, gl_FragCoord.xy / vec2(512.0)); 
  vec3 target = (uModel * vec4(behavior.xyz, 1.0)).xyz;
  float turbulence = behavior.w;

  vec3 lastPosition = sampled.xyz;
  vec3 nextPosition = lastPosition;
  float speed = sampled.a;  

  float t = uTime * 0.013849829389;
  // float t = uTime;

  nextPosition += vec3(
      simplex(vec3(nextPosition.xy * 0.005, 9280.03992092039 + t + gl_FragCoord.x / 110.0) + OFFSET)
    , simplex(vec3(nextPosition.xz * 0.005, 3870.73392092039 - t - gl_FragCoord.y / 110.0) + OFFSET)
    , simplex(vec3(nextPosition.zy * 0.005, 3870.73392092039 - t - gl_FragCoord.z / 110.0) + OFFSET)
  ) * turbulence;

  // Circular current:
  //  
  // float radius = length(nextPosition);
  // float rad = 0.00002 * radius;
  
  // nextPosition = vec3(
  //     nextPosition.x * cos(rad) - nextPosition.y * sin(rad)
  //   , nextPosition.y * cos(rad) + nextPosition.x * sin(rad)
  //   , nextPosition.z * cos(rad) - nextPosition.z * sin(rad)
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
  
  vec3 velocity = attraction + springForce;
  nextPosition += 0.2 * velocity * speed;

  float nextSpeed = length(velocity);
  gl_FragColor = vec4(nextPosition.xy, 100.0 + nextPosition.z * 0.1, nextSpeed);
  // gl_FragColor = vec4(gl_FragCoord.xy, 1.0, 1.0);
}