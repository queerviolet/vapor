import React from 'react'
import {render} from 'react-dom'

import particles from './demo'
import Blast from './talk/blast.kubo'

const main = document.createElement('div')
document.body.appendChild(main)

// window.addEventListener('mousemove',
//   ({clientX, clientY}) => particles.chase(clientX, clientY))

let req = null
window.addEventListener('scroll',
  () => req = req || requestAnimationFrame(update))

function update() {
  req = null
  const centerX = window.innerWidth / 2
      , centerY = window.innerHeight / 2
  
  const {target, el} =
    Array.from(document.querySelectorAll('.particle-target'))
      .map(el => {
        const {top, left, width, height} = el.getBoundingClientRect()
            , cx = left + width / 2
            , cy = top + height / 2
            , dx = cx - centerX
            , dy = cy - centerY
        return {el, distance: dy * dy, target: [cx, cy]}
      })
      .sort(asc)[0] || {}
  if (target) {
    particles.chase(...target)
    particles.shape(el.dataset.shape)
    if ('turbulence' in el.dataset) {
      particles.turbulence(+el.dataset.turbulence)
    } else {
      particles.turbulence(16)
    }
  }
}

const asc = ({distance: x}, {distance: y}) => x - y



const App = ({children}) => <div>{children}</div>

console.log(Blast.mmm)

render(<App><Blast /></App>, main)