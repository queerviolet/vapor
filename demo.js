'use strict'

var createBuffer = require('gl-buffer')
var createShell  = require('gl-now')
var createFBO    = require('gl-fbo')
var createVAO    = require('gl-vao')
var createTexture = require('gl-texture2d')
const pip = require('gl-texture2d-pip')

var ndarray = require('ndarray')
var fill    = require('ndarray-fill')

let screenVertices
var particleVertices
var nextState
var prevState
let behaviorFbo, behaviorNd
var shaders

// let target = {x: window.innerWidth / 2, y: window.innerHeight / 2}
let uGravity = 0
let uTurbulence = 16.0
let uOffset = [0, 0]

var t = 0
var shell = createShell({
  clearColor: [1,1,1,1],
  preventDefaults: false,
})

shell.on('gl-init', init)
shell.on('gl-render', render)

let didInit
module.exports = new Promise(resolve => didInit = resolve)
    .then(() => ({reset, model, groups, group, scroll}))

function scroll(x, y) {
  uOffset = [2 * x, 1.8 * y]
}

let particleBehaviorHasChanged = false
function updateParticles() {
  if (!behaviorFbo) return
  if (!particleBehaviorHasChanged) return
  console.log('updating particles')
  behaviorFbo.color[0].setPixels(behaviorNd)  
  particleBehaviorHasChanged = false
}

function model({positions}, turbulence) {
  const buf = behaviorNd.data
  let i = Math.min(positions.length, 512); while (--i) {
    buf[4 * i + 0] = 200 * positions[i][0]
    buf[4 * i + 1] = 200 * positions[i][1]
    buf[4 * i + 2] = turbulence
    buf[4 * i + 3] = turbulence
  }
  particleBehaviorHasChanged = true
}

function groups() {
  const groups = new Array(512)
  for (let i = 0; i != 512; ++i) {
    groups[i] = group(i)
  }
  return groups
}

const group = i => {
  const col = behaviorNd.pick(i)
  return new Group(col)
}

class Group {
  constructor(behavior) {
    this.behavior = behavior
  }

  chase(target, turbulence=8) {
    const {width, height} = shell
      , pX = x => width * (-1 + 2 * (x / width))
      , pY = y => height * (1 - 2 * (y / height))
      , {behavior: col} = this
      , P = Array.isArray(target)
          ? t => target
          : target
      , [turbX, turbY] = Array.isArray(turbulence)
          ? turbulence
          : [turbulence, turbulence]

    fill(col, (y, ch) => {
      const t = y / 512
          , [px, py] = P(y / 512)
      switch (ch) {
        case 0: return pX(px)
        case 1: return pY(py)
        case 2: return turbX
        case 3: return turbY
      }
      return 0
    })
    particleBehaviorHasChanged = true
    return this
  }

  flush() { return flush() }
}

function reset(turbulence=8) {
  fill(behaviorNd, (x, y, ch) => {
    switch (ch) {
      case 0: return 0
      case 1: return 0
      case 2: return turbulence
      case 3: return turbulence
    }
    return 0
  })
  behaviorFbo.color[0].setPixels(behaviorNd)
}

window.shell = shell

function init() {
  // Set ourselves in the background
  shell.element.style.position = 'fixed'
  shell.element.style.zIndex = -10000
  document.body.style.overflow = 'auto'

  var gl = shell.gl
  console.log(gl.getSupportedExtensions())
  console.log('ext:', gl.getExtension('EXT_color_buffer_float'))
  shaders = require('./shaders')(gl)

  nextState = createFBO(gl, 512, 512, { 'float': true })
  prevState = createFBO(gl, 512, 512, { 'float': true })
  behaviorFbo = createFBO(gl, 512, 512, { 'float': true })
  behaviorNd = ndarray(new Float32Array(512 * 512 * 4), [512, 512, 4])
  window.behaviorNd = behaviorNd
  fill(behaviorNd, (x, y, ch) => {
    switch (ch) {
      case 0: return Math.random() * 823
      case 1: return Math.random() * 847
      case 2: return 12
      case 3: return 12
    }
  })
  behaviorFbo.color[0].setPixels(behaviorNd)
  
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

  didInit()
}

var cleared = false
window.shell = shell

let renderLock = 0
function render() {
  if (++renderLock == 5)
    return console.error(`Too many failures, rendering suppressed.`)
  if (renderLock > 5) return
  
  updateParticles()

  var gl = shell.gl
  // Switch to clean FBO for GPGPU
  // particle motion
  nextState.bind()
  gl.disable(gl.DEPTH_TEST)
  gl.viewport(0, 0, 512, 512)

  var shader = shaders.logic
  shader.bind()
  shader.uniforms.uState = prevState.color[0].bind(0)
  shader.uniforms.uTarget = behaviorFbo.color[0].bind(1)  
  shader.uniforms.uTime = t++
  // shader.uniforms.uTurbulence = uTurbulence
  shader.uniforms.uGravity = uGravity

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
  shader.uniforms.uOffset = uOffset  

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

  pip([prevState.color[0], nextState.color[0]])

  --renderLock
}
