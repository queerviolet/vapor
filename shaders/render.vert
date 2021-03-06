#ifdef GL_ES
precision mediump float;
#endif

attribute vec2 aIndex;

uniform vec2 uScreen;
uniform vec2 uOffset;
uniform sampler2D uState;

uniform mat4 uProjection;
uniform mat4 uView;

varying vec2 vIndex;

void main() {
  vec4 sample = texture2D(uState, aIndex);
  vIndex = aIndex;
  gl_PointSize = 2.0;
  gl_Position = uProjection * uView * vec4(sample.xyz, 1.0) + vec4(uOffset / 5.0, 0.0, 0.0);
      //vec4((uOffset + sample.xy) / uScreen, 1.0, 1.0);
}
