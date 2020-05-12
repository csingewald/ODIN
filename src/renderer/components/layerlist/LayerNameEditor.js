import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core/styles'
import { InputBase } from '@material-ui/core'

const useStyles = makeStyles((theme) => ({
  editor: {
    paddingLeft: '8px',
    paddingTop: '2px',
    paddingBottom: '1px',
    borderBottom: '1px solid #cccccc',
    width: '100%'
  }
}))


const validators = [
  { func: (value) => value.length > 10, error: 'The value must be shorter than 10 characters.' },
  { func: (value) => value.length < 2, error: 'The value must be longer than 2 characters.' }
]

function validate (value) {
  return validators.map(v => v.func(value) ? v.error : null).filter(x => x != null)
}

/**
 *
 */
export const LayerNameEditor = props => {
  const classes = useStyles()


  const handleChange = event => props.update(event.target.value)
  const handleKeyDown = event => {
    switch (event.key) {
      case 'Enter': return props.commit()
      case 'Escape': return props.cancel()
    }
  }

  const errors = validate(props.value)
  const hasError = () => errors != null && errors.length > 0

  const style = (hasError()) ? { borderBottom: '1px solid red' } : {}
  console.log(props.value, props.value.length)
  return (
    <>
      <InputBase
        className={classes.editor}
        style={ style }
        value={props.value}
        autoFocus
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onBlur={props.cancel}
      />
      <div style={ { display: hasError() ? 'block' : 'none', width: '100%', textAlign: 'start', color: 'red', fontSize: '0.8em', paddingLeft: '8px', paddingRight: '8px' } }>{ errors[0] }</div>
    </>
  )
}

LayerNameEditor.propTypes = {
  value: PropTypes.string.isRequired,

  /**
   * cancel :: () -> unit
   * Cancel editor, layer name remains unchanged.
   */
  cancel: PropTypes.func.isRequired,

  /**
   * commit :: () -> unit
   * Set editor value as new layer name.
   */
  commit: PropTypes.func.isRequired,

  /**
   * update :: string -> unit
   * Update editor value.
   */
  update: PropTypes.func.isRequired
}
