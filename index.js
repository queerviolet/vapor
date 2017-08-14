import React from 'react'
import {render} from 'react-dom'
import {AppContainer} from 'react-hot-loader'

import bunny from 'bunny'
import {line, offsetXY} from './geom'
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

let req = null
particles.then(particles => {
  const update = updateWithParticles(particles)
  window.addEventListener('scroll',
    () => req = req || requestAnimationFrame(update))
  update()
  particles.model(bunny)
})

const visibleAt = Symbol()
const isTracking = Symbol()
const targetId = Symbol()
const updateWithParticles = particles => {
  const groups = particles.groups()
  let tick = 0
  return () => {
    req = null
    const {innerWidth: wWidth,
           innerHeight: wHeight,
           scrollX, scrollY} = window
    particles.scroll(scrollX, scrollY)    
    return

    const visible = Array
       .from(document.querySelectorAll('.particle-target'))
       .map(visibleInWindow(wWidth, wHeight, tick))
       .filter(x => x)

    if (!visible.length) {
      let i = groups.length; while (--i >= 0) {
        const group = groups[i]
        if (group[isTracking]) {
          group.chase([0, 0], 12)
          group[isTracking] = null
        }
      }
      return
    }
    
    const trackers = {}
    let i = groups.length; while (--i >= 0) {
      const group = groups[i]
      // If you're not assigned, or you're tracking something that's
      // off-screen, we're going to give you something to chase.      
      const groupIsFree =
          !group[isTracking] ||
          group[isTracking][visibleAt] !== tick
      let shouldReassign = false
      if (!groupIsFree) {
        const id = group[isTracking][targetId]
        trackers[id] = (trackers[id] || 0) + 1
        if (trackers[id] > 1.1 * (groups.length / visible.length))
          shouldReassign = true
      }
      if (groupIsFree || shouldReassign) {
        const something = visible[Math.floor(Math.random() * visible.length)]
            , {el} = something
            , {target=[0, 0],
               turbulence=12} = el
            , [x0, y0] = offsetXY(el)
        group.chase(relativeTo(x0, y0)(target), turbulence)
        group[isTracking] = something.el
      }
    }
    
    ++tick       
  }
}

let nextTargetId = 0
const visibleInWindow = (wWidth, wHeight, tick) => el => {
  const box = el.getBoundingClientRect()
      , {top, bottom, left, right, width, height} = box
  if (top > 0 && top < wHeight ||
      bottom > 0 && bottom < wHeight) {
    el[visibleAt] = tick
    el[targetId] = el[targetId] || nextTargetId++
    return {el, box}
  }
  return null
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

const asc = ({distance: x}, {distance: y}) => x - y

const App = ({children}) => <div>{children}</div>

import Whoami from './talk/whoami.kubo'
import AboutReact from './talk/react.kubo'
import AboutWebGL from './talk/webgl.kubo'

import Target from './Target'
import Shape from './Shape'
import Slide from './Slide'

render(
  <AppContainer>
    <App>
      <Target style={{margin: 'auto'}}/>
      <Whoami />
      <Target target={line([0, 0], [500, 0])} turbulence={5}
        style={{margin: 'auto', width: 500}}/>
      <AboutReact />
      <Shape
        style={{width: '50%', margin: 'auto'}}
        points={[
          [0, 0],
          [200, 0],
          [200, 200],
          [0, 200],
          [0, 0],
        ]} 
        turbulence={8} />
      <AboutReact />
      <Slide>
        <Shape points={[
          [250, 150],
          [375, 0],        
          [500, 100],
          [250, 500],
          [0, 100],
          [125, 0],
          [250, 150],
        ]} style={{
          margin: 'auto',
          width: '500px',
          height: '500px'}} turbulence={8} /> 
      </Slide>
    </App>
  </AppContainer>, main)