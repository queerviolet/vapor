import React          from 'react'
import {render}       from 'react-dom'
import {AppContainer} from 'react-hot-loader'
 
import Vapor from './Vapor'
import Play from './Play'

render(
  <AppContainer>
    <Vapor size={9}>
      <Play title='playground' />
    </Vapor>
  </AppContainer>, main)