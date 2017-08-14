import React from 'react'
import firebase from '../fire'
const db = firebase.database()
    , auth = firebase.auth()
auth.onAuthStateChanged(user => user || auth.signInAnonymously())


import Sequencer from './Sequencer'

// This component is a little piece of glue between React router
// and our Scratchpad component. It takes in props.params.title, and
// shows the Scratchpad along with that title.
export default ({title}) =>
  <Sequencer fireRef={db.ref('sequencers').child(title)}/>
