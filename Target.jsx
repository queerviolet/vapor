import React from 'react'

module.exports = class extends React.Component {    
  componentWillReceiveProps(incoming) {
    this.updateTarget(incoming)
  }

  targetDidMount = el => {
    this.targetElement = el
    this.updateTarget(this.props)
  }

  updateTarget({target, turbulence}) {
    if (!this.targetElement) return
    this.targetElement.target = target
    this.targetElement.turbulence = turbulence
  }

  style = {
    width: '100px',
    height: '100px',
    border: 'thin solid fuchsia'
  }

  render() {
    const {style={}} = this.props
    return <div className='particle-target' style={this.style} ref={this.targetDidMount} />
  }
}