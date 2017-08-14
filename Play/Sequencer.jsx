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

  play = (note, duration, velocity, onPlay=() => {}) => time => (
    onPlay(time),
    this.synth.triggerAttackRelease(note, duration, time, velocity)
  )

  schedule = (note, time, duration, velocity, onPlay) =>
    this.tx.schedule(this.play(note, duration, velocity, onPlay), time)

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

  loadProps({note, time, duration, velocity, onPlay}) {
    this.context.clear(this.eventId)
    this.eventId = this.context.schedule(note, time, duration, velocity, onPlay)
  }

  render() { return null }
}
Note.contextTypes = Voice.childContextTypes

export default class extends React.Component {
  state = {isPlaying: false, value: ''}

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
              <tr key={note}>
                <Voice resonance={0.9}> {                
                  new Array(measures).fill('x').map((_, m) =>
                    [0, 1, 2, 3].map(beat => {
                      const time = `${m}:${beat}`
                          , key = `${note}@${time}`
                      return <td key={key}>
                        <Sample beat={beat} note={note} time={time} duration='8n' baseRef={fireRef}/>
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

import Vapor from '../Vapor'

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
      background: this.state.playing ? 'rgba(255, 0, 255, 0.6)'
        : this.state.value ? 'rgba(255, 20, 147, 0.4)' : 'none',
      border: '1px solid deeppink',
      width: '100px',
      height: '100px',
      margin: 'auto',
      borderRadius: '100%',
    }
  }

  onPlay = () => {
    this.setState({playing: true})
    const box = this.refs.me.getBoundingClientRect()
        , centerXY = [box.left + box.width / 2,
                      box.top + box.height / 2]
        , {beat=0} = this.props
    this.context.draw(centerXY, [8, 8], 512)
    this.context.draw(centerXY, [24, 24], 1024)
    // this.context.setTargetOffset(centerXY)
    // this.context.setGravity(beat % 2 === 0 ? 1 : -1)
    setTimeout(() => this.setState({playing: false}), 113)
  }

  render() {
    const {value=false} = this.state
        , {note, time, duration} = this.props
    return <div style={this.style} onClick={this.onClick} ref='me'>
      {value ? <Note note={note} onPlay={this.onPlay} duration={duration} time={time}/> : null}
    </div>
  }
}

Sample.contextTypes = Vapor.childContextTypes