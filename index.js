import React from 'react'
import {render} from 'react-dom'
import {AppContainer} from 'react-hot-loader'

import particles from './demo'

const main = document.createElement('div')
document.body.appendChild(main)

// window.addEventListener('mousemove',
//   evt => {
//     const {clientX: x1, clientY: y1, movementX: dx, movementY: dy} = evt
//         , dist = dx ** 2 + dy ** 2
//         , x0 = x1 - dx
//         , y0 = y1 - dy
//         , from = [x0, y0]
//         , to = [x1, y1]
//     let t = Math.min(Math.max(Math.sqrt(dist), 2), 16)
//     particles.chase(line(from, to), [dx, dy])
//   })

let line = ([x0, y0], [x1, y1]) => {
  const dx = x1 - x0
      , dy = y1 - y0
  return t => [x0 + t * dx, y0 + t * dy]
}

let req = null
window.addEventListener('scroll',
  () => req = req || requestAnimationFrame(update))


const initQueue = () => new Array(512).fill('x').map((x, i) => i)

let clusterIds = Symbol()
let clusterIdQueue = initQueue()
let chasing = []

function update() {
  req = null
  const wWidth = window.innerWidth
      , wHeight = window.innerHeight
  
  const visible = Array
      .from(document.querySelectorAll('.particle-target'))
      .map(visibleInWindow(wWidth, wHeight))
      .filter(x => x)
  
  if (!visible.length && chasing.length) {
    // reset
    console.log('chasing nothing, reset')
    chasing.forEach(el => el[clusterIds] = null)
    clusterIdQueue = initQueue()
    chasing = []
    particles.reset()
    return
  }

   console.log('chasing:', chasing, 'visible:', visible)
  chasing = chasing
    .map(el => {
      if (!visible.find(({el: visibleEl}) => visibleEl === el)) {
        // We were chasing this, but now it's off screen
        console.log('no longer chasing', el[clusterIds])
        if (!el[clusterIds]) return
        // free up cluster ids
        clusterIdQueue.push(...el[clusterIds])
        el[clusterIds] = null
        return
      }
      return el
    })
    .filter(x => x)
  
  visible.forEach(({el, box}) => {
    if (el[clusterIds]) return // We're already chasing this one
    console.log('now chasing', el, box)
    startChasing({el, box})
    chasing.push(el)
  })

  // TODO: Drain the queue to stop chasing things that are offscreen.
  if (visible.length)
    while (clusterIdQueue.length) {
      const something = visible[Math.floor(Math.random() * visible.length)]
      startChasing(something)
    }

  particles.flush()
}

const relativeTo = (x0, y0) => target => {
  const P = Array.isArray(target)
    ? t => target
    : target
  return t => {
    const [x, y] = P(t)
    return [x0 + x, y0 + y]
  }
}

function startChasing({el, box: {top, left}}) {
  if (!clusterIdQueue.length) return
  const id = clusterIdQueue.shift()
      , {target=[0, 0], turbulence=12} = el
  particles.chase(relativeTo(left, top)(target), turbulence, id, false)
  ;(el[clusterIds] = el[clusterIds] || [])
    .push(id)
}

const visibleInWindow = (wWidth, wHeight) => el => {
  const box = el.getBoundingClientRect()
      , {top, bottom, left, right, width, height} = box
  if (top > 0 && top < wHeight ||
      bottom > 0 && bottom < wHeight) {
    return {el, box}
  }
  return null
}

const asc = ({distance: x}, {distance: y}) => x - y

const App = ({children}) => <div>{children}</div>

import Whoami from './talk/whoami.kubo'
import AboutReact from './talk/react.kubo'
import AboutWebGL from './talk/webgl.kubo'

import Target from './Target'

render(
  <AppContainer>
    <App>
      <Target />
      <Whoami />
      <AboutReact />
      <Target />      
      <AboutWebGL />
      <Target />      
    </App>
  </AppContainer>, main)