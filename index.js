import React from 'react'
import {render} from 'react-dom'

import demo from './demo'
import Blast from './talk/blast.kubo'

const main = document.createElement('div')
document.body.appendChild(main)
demo.on('gl-init', () => {
  console.log(demo.element)
  demo.element.style.position = 'fixed'
  demo.element.style.zIndex = -10000
})

const App = ({children}) => <div>{children}</div>

console.log(Blast.mmm)

render(<App><Blast /></App>, main)