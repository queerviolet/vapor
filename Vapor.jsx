import createBuffer  from 'gl-buffer'
import createContext from 'gl-context'
import createFBO     from 'gl-fbo'
import createVAO     from 'gl-vao'
import createTexture from 'gl-texture2d'
import pip           from 'gl-texture2d-pip'

import ndarray from 'ndarray'
import fill    from 'ndarray-fill'

import React from 'react'

import shaders from './shaders'

export default class extends React.Component {
  componentDidMount() {
    window.addEventListener('resize', this.resize)
    window.addEventListener('mousemove', this.onMouseMove)
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.resize)    
    window.removeEventListener('mousemove', this.onMouseMove)
  }

  behaviorDirty = false
  writeIndex = 0
  write([targetX, targetY], [turbulenceX, turbulenceY],
        i=this.writeIndex = (this.writeIndex + 1) % this.numParticles) {
    const {data} = this.behaviorNd
    data[4 * i + 0] = targetX
    data[4 * i + 1] = targetY
    data[4 * i + 2] = turbulenceX
    data[4 * i + 3] = turbulenceY
    this.behaviorDirty = true
  }

  updateBehavior() {
    if (!this.behaviorDirty) return
    this.behaviorFb.color[0].setPixels(this.behaviorNd)
    this.behaviorDirty = false
  }

  draw(pageXY, turbulence, count=1) {
    while (--count >= 0)
      this.write(this.shaderXYFromPage(pageXY), turbulence)
  }

  resize = () => {
    const {canvas} = this
    if (!canvas) return
    const {width, height} = this.canvas.getBoundingClientRect()
    this.width = width
    this.height = height
    if (width !== canvas.width || height !== canvas.height) {
      canvas.width = width
      canvas.height = height
      this.shaderXYFromPage = ([x, y]) => [
        width * (-1 + 2 * (x / width)),
        height * (1 - 2 * (y / height))
      ]      
    }
  }

  get dimension() {
    const {size=9} = this.props
    return 2 ** size
  }

  get numParticles() {
    return this.dimension * this.dimension
  }

  canvasDidMount = canvas => {
    const {dimension} = this
    const gl = this.gl = canvas.getContext('webgl')
    this.canvas = canvas
    this.shaders = shaders(gl)

    Object.assign(this,
      initFrameBuffers(gl, dimension),
      initVertexBuffers(gl, dimension))
    
    this.resize()
    this.frame()
  }

  frame = ts => {   
    const {
      gl,
      shaders,
      dimension,
      width, height,
      
      nextStateFb, prevStateFb,
      behaviorFb,
      
      screenVa, particlesVa,
      
      uTime=0,
      uOffset=[0,0],
    } = this
    const {gravity: uGravity=0} = this.props

    this.updateBehavior()

    computeState(gl, nextStateFb, {
      shader: shaders.logic,
      verticesVa: screenVa,
      dimension,
      uniforms: {
        uState: prevStateFb.color[0].bind(0),
        uTarget: behaviorFb.color[0].bind(1),
        uGravity,
        uTime
      }
    })
    
    // Reset, draw to screen
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.disable(gl.DEPTH_TEST)
    gl.viewport(0, 0, width, height)
    
    drawParticles(gl, {
      shader: shaders.render,
      particlesVa,
      dimension,
      uniforms: {
        uState: nextStateFb.color[0].bind(0),
        uScreen: [width, height],
        uOffset: [2 * window.scrollX, 2 * window.scrollY]
      }
    })

    // Draw previews of our states
    pip([prevStateFb.color[0], nextStateFb.color[0]])

    // Swap prev and next states
    this.nextStateFb = prevStateFb    
    this.prevStateFb = nextStateFb

    this.uTime = uTime + 1
    this.raf = requestAnimationFrame(this.frame)    
  }

  onMouseMove = ({clientX: x1, clientY: y1, movementX: dx, movementY: dy}) =>
    this.draw([x1, y1], [8, 8], 32)

  render() {
    return <div>
             <canvas ref={this.canvasDidMount}
                     style={fullscreenBackground} />
             {this.props.children}
           </div>
  }
}

const fullscreenBackground = {
  position: 'fixed',
  top: 0, left: 0, bottom: 0, right: 0,  
  zIndex: -1e6,
  width: '100vw',
  height: '100vh',
}

const stateFb = (gl, dim) =>
  createFBO(gl, dim, dim, { 'float': true })

const stateNd = dim => 
  ndarray(new Float32Array(dim * dim * 4), [dim, dim, 4])

function initFrameBuffers(gl, dim) {
  const nextStateFb = stateFb(gl, dim)
      , prevStateFb = stateFb(gl, dim)
      , initialStateNd = stateNd(dim)

      , behaviorFb = stateFb(gl, dim)
      , behaviorNd = stateNd(dim)

  // Create an initial state of zeroes
  fill(initialStateNd, (x, y, ch) => 0) //ch > 2 ? 1 : (Math.random() - 0.5) * 800.6125)

  
  // Upload initial state.
  nextStateFb.color[0].setPixels(initialStateNd)
  prevStateFb.color[0].setPixels(initialStateNd)

  // Behavior encodes [target(x, y), turbulence(x, y)]
  // for all particles.
  fill(behaviorNd, (x, y, ch) => {
    switch (ch) {
      case 0: return 0
      case 1: return 0
      case 2: return 12
      case 3: return 12
    }
  })

  // Upload initial behavior.
  behaviorFb.color[0].setPixels(behaviorNd)

  return {
    nextStateFb, prevStateFb, initialStateNd,
    behaviorFb, behaviorNd
  }
}

function initVertexBuffers(gl, dim) {
  // The screenVa just contains the six vertices for a
  // quad that covers the screen.
  //
  // Probably we should replace this with a-big-triangle.
  const screenVa = createVAO(gl, null, [{
      type: gl.FLOAT
    , size: 2
    , buffer: createBuffer(gl, new Float32Array([
      -1, -1,  +1, -1,  -1, +1,
      -1, +1,  +1, -1,  +1, +1,
    ]))
  }])

  // Initialize an array of position coordinates for
  // each index. This is what tells particle 0 to look
  // at (0, 0), and particle 1 to look at (0, 1 / dim),
  // and so on
  const indexAry = new Float32Array(dim * dim * 2)
  let i = 0
  for (var x = 0; x < dim; x++)
    for (var y = 0; y < dim; y++) {
      indexAry[i++] = x / dim
      indexAry[i++] = y / dim
    }

  // This is a buffer containing the (x, y) coordinates
  // at which to look up each particle's position in the
  // state.
  const particlesVa = createVAO(gl, null, [{
      type: gl.FLOAT
    , size: 2
    , buffer: createBuffer(gl, indexAry)
  }])
  
  return {screenVa, particlesVa}
}

function computeState(gl, nextFb, {shader, uniforms, verticesVa, dimension}) {
  // Switch to clean FBO for GPGPU
  // particle motion
  nextFb.bind()
  gl.disable(gl.DEPTH_TEST)
  gl.viewport(0, 0, dimension, dimension)

  shader.bind()
  Object.assign(shader.uniforms, uniforms)
  
  verticesVa.bind()
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}

function drawParticles(gl, {shader, particlesVa, uniforms, dimension}) {
  shader.bind()
  Object.assign(shader.uniforms, uniforms)

  particlesVa.bind()

  // Additive blending!
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
  // gl.blendFunc(gl.ONE, gl.ONE)
  gl.drawArrays(gl.POINTS, 0, dimension * dimension)
  // gl.drawArrays(gl.POINTS, 0, 512 * 512)
  gl.disable(gl.BLEND)
}