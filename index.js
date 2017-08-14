import React          from 'react'
import {render}       from 'react-dom'
import {AppContainer} from 'react-hot-loader'
 
import Vapor from './Vapor'
import Play from './Play'

render(
  <AppContainer>
    <Vapor>
      <Play title='playground' />
    </Vapor>
  </AppContainer>, main)