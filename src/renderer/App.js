import React from 'react'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'
import OSD from './components/OSD'
import Map from './map/Map'
import Management from './components/Management'
import Sidebar from './components/Sidebar'
import { ipcRenderer } from 'electron'

const App = (props) => {
  const { classes } = props
  const appProps = { ...props, ...{ id: 'map' } }

  const [showManagement, setManagement] = React.useState(false)

  React.useEffect(() => {
    const subscribeToProjects = () => {
      ipcRenderer.on('IPC_PROJECTS', (projects) => {
        console.dir(projects)
      })
    }
    return () => ipcRenderer.removeListener('IPC_PROJECTS', subscribeToProjects)
  })

  const toggleManagementUI = event => {
    setManagement(showManagement => !showManagement)
  }

  if (showManagement) {
    return (
      <React.Fragment>
        <Sidebar clickAction={toggleManagementUI}/>
        <Management />
      </React.Fragment>
    )
  }

  return (
    <React.Fragment>
      <Map { ...appProps }/>
      <Sidebar clickAction={toggleManagementUI}/>
      <div className={classes.overlay}>
        <OSD />
      </div>
    </React.Fragment>
  )
}

App.propTypes = {
  classes: PropTypes.object
}

const styles = {
  overlay: {
    position: 'fixed',
    top: '1em',
    left: '3em',
    bottom: '1.5em',
    right: '1em',
    zIndex: 20,
    display: 'grid',
    gridTemplateColumns: 'auto',
    gridTemplateRows: '5em auto',
    gridGap: '1em',
    pointerEvents: 'none'
  },

  contentPanel: {
    gridRowStart: 2,
    gridColumnStart: 1,
    display: 'grid',
    gridTemplateColumns: '25em auto 25em',
    gridTemplateRows: '1fr 3fr',
    gridGap: '1em',
    gridTemplateAreas: `
      "L . R"
      "L B R"
    `
  }
}

export default withStyles(styles)(App)
