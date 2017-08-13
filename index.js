import React from 'react'
import {render} from 'react-dom'
import {AppContainer} from 'react-hot-loader'

import particles from './demo'
import Blast from './talk/blast.kubo'

const main = document.createElement('div')
document.body.appendChild(main)

window.addEventListener('mousemove',
  evt => {
    const {clientX, clientY, movementX: dx, movementY: dy} = evt
        , dist = dx ** 2 + dy ** 2
    particles.chase(clientX, clientY, Math.sqrt(dist))
  })

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