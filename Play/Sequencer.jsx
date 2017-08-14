import React from 'react'
import PropTypes from 'prop-types'
import Tone from 'tone'

window.T$ = Tone

class Transport extends React.Component {
  getChildContext() {
    return {transport: Tone.Transport}
  }

  componentDidMount() { this.loadProps(this.props) }

  componentWillReceiveProps(incoming, outgoing) {
    this.loadProps(incoming)
  }

  loadProps({
    isPlaying=false,
    loop=false,
    loopEnd,
    bpm=120,
  }) {
    const {Transport} = Tone

    if (isPlaying) {
      Transport.start()
    } else {
      Transport.stop()
    }

    Transport.loop = loop
    Transport.loopEnd = loopEnd
    Transport.bpm.value = bpm
  }

  render() {
    return <div>{this.props.children}</div>
  }
}

const timeT = PropTypes.oneOfType([
  PropTypes.number,
  PropTypes.string,
])

Transport.propTypes = {
  isPlaying: PropTypes.bool,
  loop: PropTypes.oneOfType([
    PropTypes.bool,
    timeT
  ]),
  loopEnd: timeT,
}

Transport.childContextTypes = {
  transport: PropTypes.object,
}

class Voice extends React.Component {
  getChildContext() {
    return {schedule: this.schedule, clear: this.clear}
  }

  componentDidMount() {
    this.synth = new Tone.Synth().toMaster()
  }

  get tx() { return this.context.transport }

  play = (note, duration, velocity) => time =>
    this.synth.triggerAttackRelease(note, duration, time, velocity)

  schedule = (note, time, duration, velocity) =>
    this.tx.schedule(this.play(note, duration, velocity), time)

  clear = id => this.tx.clear(id)    

  render() {
    return <div>{this.props.children}</div>
  }
}

Voice.contextTypes = Transport.childContextTypes

Voice.childContextTypes = {
  schedule: PropTypes.func,
  clear: PropTypes.func,
}

const {is, fromJS} = require('immutable')

class Note extends React.Component {
  componentDidMount() {
    this.loadProps(this.props)
  }

  componentWillReceiveProps(incoming, outgoing) {
    if (!is(fromJS(incoming), fromJS(outgoing))) {
      this.loadProps(incoming)
    }
  }

  componentWillUnmount() {
    const {eventId} = this
    eventId && this.context.clear(eventId)
  }

  loadProps({note, time, duration, velocity}) {
    this.context.clear(this.eventId)
    this.eventId = this.context.schedule(note, time, duration, velocity)
  }

  render() { return null }
}
Note.contextTypes = Voice.childContextTypes

export default class extends React.Component {
  componentDidMount() {
    // When the component mounts, start listening to the fireRef
    // we were given.
    this.listenTo(this.props.fireRef)
  }

  componentWillUnmount() {
    // When we unmount, stop listening.
    this.unsubscribe()
  }

  componentWillReceiveProps(incoming, outgoing) {
    // When the props sent to us by our parent component change,
    // start listening to the new firebase reference.
    this.listenTo(incoming.fireRef)
  }

  listenTo(fireRef) {
    // If we're already listening to a ref, stop listening there.
    if (this.unsubscribe) this.unsubscribe()

    // Whenever our ref's value changes, set {value} on our state.
    const listener = fireRef.on('value', snapshot =>
      this.setState({value: snapshot.val()}))

    // Set unsubscribe to be a function that detaches the listener.
    this.unsubscribe = () => fireRef.off('value', listener)
  }

  // Write is defined using the class property syntax.
  // This is roughly equivalent to saying,
  //
  //    this.write = event => (etc...)
  //
  // in the constructor. Incidentally, this means that write
  // is always bound to this.
  write = event => this.props.fireRef &&
    this.props.fireRef.set(event.target.value)

  state = {isPlaying: true, value: ''}

  togglePlaying = evt => this.setState({isPlaying: evt.target.checked})

  render() {
    const {value, isPlaying=true} = this.state || {}
    const {
      fireRef,
      notes=[
        'C3', 'D3', 'E3', 'F3', 'G3', 'A3', 'B3', 'C4'
      ],
      measures=2} = this.props
    return (
      <div>
        <input type='checkbox' checked={isPlaying} onChange={this.togglePlaying} />
        <Transport bpm={200} isPlaying={isPlaying} loop={true} loopEnd='2m'>
          <table style={{margin: 'auto'}}> {
            notes.map(note =>
              <tr>
                <Voice resonance={0.9}> {                
                  new Array(measures).fill('x').map((_, m) =>
                    [0, 1, 2, 3].map(beat => {
                      const time = `${m}:${beat}`
                          , key = `${note}@${time}`
                      return <td key={key}>
                        <Sample note={note} time={time} duration='8n' baseRef={fireRef}/>
                      </td>
                    })
                  )
                } </Voice>
              </tr>
            )
          } </table>
        </Transport>
      </div>
    )
  }
}

class Sample extends React.Component {
  state = {value: false}

  componentDidMount() {
    const {baseRef, note, time} = this.props
    this.fireRef = baseRef.child(note).child(time)
    const listener = this.fireRef.on('value', snap =>
      this.setState({value: snap.val()}))
    this.unsubscribe = () => this.fireRef.off('value', listener)
  }

  componentWillUnmount() {
    this.unsubscribe && this.unsubscribe()
  }

  onClick = () => this.fireRef.set(!this.state.value)

  get style() {
    return {
      background: this.state.value ? 'fuchsia' : 'lightgray',
      width: '100px',
      height: '100px',
      margin: 'auto',
      borderRadius: '100%',
    }
  }

  render() {
    const {value=false} = this.state
        , {note, time, duration} = this.props
    return <div style={this.style} onClick={this.onClick}>
      {value ? <Note note={note} duration={duration} time={time}/> : null}
    </div>
  }
}