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

  style(style) {
    return Object.assign({
      width: 0,
      height: 0,
      border: 'thin solid fuchsia'
    }, style)
  }

  render() {
    const {style={}} = this.props
    return <div className='particle-target' style={this.style(style)} ref={this.targetDidMount} />
  }
}