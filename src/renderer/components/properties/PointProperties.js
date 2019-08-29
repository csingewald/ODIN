import * as R from 'ramda'
import React from 'react'
import { Paper, TextField, FormControlLabel, Checkbox } from '@material-ui/core'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import layerStore from '../../stores/layer-store'

class PointProperties extends React.Component {
  constructor (props) {
    super(props)

    const { feature } = props
    const { title, properties } = feature

    this.state = {
      name: title || '',
      uniqueDesignation: properties.t || '',
      additionalInformation: properties.h || '',
      hostile: properties.n || ''
    }
  }

  feature () {
    const properties = {
      ...this.props.feature.properties,
      h: this.state.additionalInformation,
      n: this.state.hostile,
      t: this.state.uniqueDesignation
    }

    return {
      title: this.state.name,
      properties
    }
  }

  updateField (name, value) {
    const { layerId, featureId } = this.props
    const state = R.clone(this.state)
    state[name] = value
    this.setState(state, () => {
      layerStore.updateFeature(layerId)(featureId, this.feature())
    })
  }

  render () {
    const hostile = event => event.target.checked ? 'ENY' : ''

    return (
      <Paper
        className={ this.props.classes.paper }
        elevation={ 4 }
      >
        <TextField
          className={ this.props.classes.name }
          label={'Name'}
          value={ this.state.name }
          onChange={ event => this.updateField('name', event.target.value) }
        />

        <TextField
          className={ this.props.classes.uniqueDesignation }
          label={'Unique Designation'}
          value={ this.state.uniqueDesignation }
          onChange={ event => this.updateField('uniqueDesignation', event.target.value) }
        />

        <TextField
          className={ this.props.classes.additionalInformation }
          label={'Additional Information'}
          value={ this.state.additionalInformation }
          onChange={ event => this.updateField('additionalInformation', event.target.value) }
        />

        <FormControlLabel
          control={ <Checkbox color="secondary" checked={ this.state.hostile } /> }
          label="Hostile (Enemy)"
          labelPlacement="end"
          onChange={ event => this.updateField('hostile', hostile(event)) }
        />
      </Paper>
    )
  }
}

const styles = theme => ({
  paper: {
    padding: theme.spacing.unit * 4,
    height: 'auto',
    pointerEvents: 'auto',
    gridArea: 'R',
    background: 'rgba(252, 252, 255, 0.9)',

    display: 'grid',
    gridGap: '0.5em',
    gridTemplateColumns: 'auto auto',
    gridAutoRows: 'min-content'
  },
  name: { gridColumn: '1 / span 2' },
  uniqueDesignation: { gridColumn: '1 / span 2' },
  additionalInformation: { gridColumn: '1 / span 2' }
})

PointProperties.propTypes = {
  classes: PropTypes.any.isRequired,
  feature: PropTypes.any.isRequired,
  layerId: PropTypes.string.isRequired,
  featureId: PropTypes.string.isRequired
}

export default withStyles(styles)(PointProperties)