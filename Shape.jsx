import React from 'react'
import Target from './Target'

import {line} from './geom'

export default ({points, turbulence, style={}}) =>
<div style={Object.assign({position: 'relative'}, style)}>{
  points.map((p, i) => {
    if (!i) return
    return <Target key={i} style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0, left: 0
      }}
      target={line(points[i - 1], p)} turbulence={turbulence} /> 
  })
}</div>