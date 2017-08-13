'use strict'

var createBuffer = require('gl-buffer')
var createShell  = require('gl-now')
var createFBO    = require('gl-fbo')
var createVAO    = require('gl-vao')

var ndarray = require('ndarray')
var fill    = require('ndarray-fill')

let screenVertices
var particleVertices
var nextState
var prevState
var shaders

let target = {x: window.innerWidth / 2, y: window.innerHeight / 2}
let gravity = 0
let uFollowFragCoord = false
let uTurbulence = 16.0

var t = 0
var shell = createShell({
  clearColor: [1,1,1,1],
})

shell.on('gl-init', init)
shell.on('gl-render', render)

module.exports = {
  chase: (x, y) => target = {x, y},
  gravity: g => gravity = g,
  shape: shape => uFollowFragCoord = shape === 'plane',
  turbulence: turb => uTurbulence = turb
}

function init() {
  // Set ourselves in the background
  shell.element.style.position = 'fixed'
  shell.element.style.zIndex = -10000
  document.body.style.overflow = 'auto'

  var gl = shell.gl

  shaders = require('./shaders')(gl)

  nextState = createFBO(gl, 512, 512, { 'float': true })
  prevState = createFBO(gl, 512, 512, { 'float': true })

  var initialState = ndarray(new Float32Array(512 * 512 * 4), [512, 512, 4])
  fill(initialState, function(x, y, ch) {
    // if (ch > 2) return 1
    // return (Math.random() - 0.5) * 800.6125    
    return 0
  })

  nextState.color[0].setPixels(initialState)
  prevState.color[0].setPixels(initialState)

  screenVertices = createVAO(gl, null, [{
      type: gl.FLOAT
    , size: 2
    , buffer: createBuffer(gl, new Float32Array([
      -1, -1,  +1, -1,  -1, +1,
      -1, +1,  +1, -1,  +1, +1,
    ]))
  }])

  var index = new Float32Array(512 * 512 * 2)
  var i = 0
  for (var x = 0; x < 512; x++)
    for (var y = 0; y < 512; y++) {
      index[i++] = x / 512
      index[i++] = y / 512
    }

  particleVertices = createVAO(gl, null, [{
      type: gl.FLOAT
    , size: 2
    , buffer: createBuffer(gl, index)
  }])
}

var cleared = false
window.shell = shell

function render() {
  var gl = shell.gl
  // Switch to clean FBO for GPGPU
  // particle motion
  nextState.bind()
  gl.disable(gl.DEPTH_TEST)
  gl.viewport(0, 0, 512, 512)

  var shader = shaders.logic
  shader.bind()
  shader.uniforms.uState = prevState.color[0].bind(0)
  shader.uniforms.uTime = t++
  const {mouseX, mouseY, width, height} = shell  
  shader.uniforms.uTarget = [
    width * (-1 + 2 * (target.x / width)),
    height * (1 - 2 * (target.y / height))
  ]

  shader.uniforms.uFollowFragCoord = uFollowFragCoord
  shader.uniforms.uTurbulence = uTurbulence
  shader.uniforms.uGravity = gravity

  screenVertices.bind()
  gl.drawArrays(gl.TRIANGLES, 0, 6)

  // Reset, draw to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  gl.disable(gl.DEPTH_TEST)
  gl.viewport(0, 0, shell.width, shell.height)

  var shader = shaders.render
  shader.bind()
  shader.uniforms.uState = nextState.color[0].bind(0)
  shader.uniforms.uScreen = [shell.width, shell.height]

  particleVertices.bind()

  // Additive blending!
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  // gl.blendFunc(gl.ONE, gl.ONE)
  gl.drawArrays(gl.POINTS, 0, 512 * 512)
  // gl.drawArrays(gl.POINTS, 0, 512 * 512)
  gl.disable(gl.BLEND)

  // Switch
  var tmp = prevState
  prevState = nextState
  nextState = tmp
}
