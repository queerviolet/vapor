import React from 'react'
import {render} from 'react-dom'
import {AppContainer} from 'react-hot-loader'

import particles from './demo'
import Blast from './talk/blast.kubo'

const main = document.createElement('div')
document.body.appendChild(main)

window.addEventListener('mousemove',
  evt => {
    const {clientX: x1, clientY: y1, movementX: dx, movementY: dy} = evt
        , dist = dx ** 2 + dy ** 2
        , x0 = x1 - dx
        , y0 = y1 - dy
        , from = [x0, y0]
        , to = [x1, y1]
    particles.chase(line(from, to), 0)//Math.sqrt(dist))
  })

let line = ([x0, y0], [x1, y1]) => {
  const dx = x1 - x0
      , dy = y1 - y0
  return t => [x0 + t * dx, y0 + t * dy]
}

let req = null
window.addEventListener('scroll',
  () => req = req || requestAnimationFrame(update))

  function update() {
  // req = null
  // const centerX = window.innerWidth / 2
  //     , centerY = window.innerHeight / 2
  
  // const {target, el} =
  //   Array.from(document.querySelectorAll('.particle-target'))
  //     .map(el => {
  //       const {top, left, width, height} = el.getBoundingClientRect()
  //           , cx = left + width / 2
  //           , cy = top + height / 2
  //           , dx = cx - centerX
  //           , dy = cy - centerY
  //       return {el, distance: dy * dy, target: [cx, cy]}
  //     })
  //     .sort(asc)[0] || {}
  // if (target) {    
  //   particles.chase(...target)    
  //   const t = +el.dataset.turbulence; if (t) {
  //     particles.turbulence(t)
  //   } else {
  //     particles.turbulence(16)
  //   }
  // }
}

const asc = ({distance: x}, {distance: y}) => x - y

const App = ({children}) => <div>{children}</div>

console.log(Blast.mmm)

render(
  <AppContainer>
    <App>
      <Blast />
    </App>
  </AppContainer>, main)