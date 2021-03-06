import React from 'react'
import L from 'leaflet'
import { withStyles } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import { ipcRenderer } from 'electron'
import throttle from 'lodash.throttle'
import evented from '../../evented'
import { K } from '../../../shared/combinators'
import { zoomLevels } from './zoom-levels'
import { tileProvider } from '../ipc/tile-provider'
import ipcHandlers from '../ipc/ipc'
import coord from '../../coord-format'
import settings from '../../model/settings'
import './Map.layers'
import './map-tools'
import './svg-renderer'

const updateScaleDisplay = map => () => {
  const level = zoomLevels[map.getZoom()]
  if (level) evented.emit('OSD_MESSAGE', { slot: 'C2', message: level.scale })
}

const saveViewPort = ({ target }) => {
  const { lat, lng } = target.getCenter().wrap()
  const zoom = target.getZoom()
  settings.map.setViewPort({ lat, lng, zoom })
}

const updateCoordinateDisplay = ({ latlng }) => {
  const message = `${coord.format(latlng.wrap())}`
  evented.emit('OSD_MESSAGE', { slot: 'C3', message })
}

class Map extends React.Component {
  componentDidMount () {
    const { id, options, onMoveend, onZoomend, onClick } = this.props
    const viewPort = settings.map.getViewPort()

    // Override center/zoom options if available from settings:
    if (viewPort) {
      options.center = L.latLng(viewPort.lat, viewPort.lng)
      options.zoom = viewPort.zoom
    }

    this.map = K(L.map(id, options))(map => {
      evented.emit('MAP_CREATED', map)

      const mapVisible = settings.map.visible()
      if (mapVisible) L.tileLayer(tileProvider().url, tileProvider()).addTo(map)

      map.on('moveend', saveViewPort)
      map.on('moveend', event => onMoveend(event.target.getCenter()))
      map.on('zoom', updateScaleDisplay(map))
      map.on('zoomend', event => onZoomend(event.target.getZoom()))

      map.on('mousemove', throttle(updateCoordinateDisplay, 75))
      map.on('click', event => {
        if (event.originalEvent.target !== map._container) return
        onClick()
      })
      map._container.focus()
    })

    evented.on('OSD_MOUNTED', updateScaleDisplay(this.map))
    evented.on('map.center', latlng => this.map.panTo(latlng))
    evented.on('map.viewport', (center, zoom) => this.map.flyTo(center, zoom))
    evented.on('map.marker', marker => marker.addTo(this.map))

    // Bind command handlers after map was initialized:
    const context = { map: this.map }
    Object.entries(ipcHandlers).forEach(([channel, handler]) => {
      ipcRenderer.on(channel, (_, args) => handler(context)(args))
    })
  }

  // FIXME: why did we need this?
  // componentDidUpdate (prevProps) {
  //   const map = this.map
  //   const { center, zoom } = this.props

  //   const centerChanged = center && !map.getCenter().equals(center)
  //   const zoomChanged = zoom && map.getZoom() !== zoom

  //   console.log('center', center, map.getCenter(), centerChanged)
  //   console.log('zoom', zoom, map.getZoom(), zoomChanged)

  //   // if (centerChanged && zoomChanged) map.flyTo(center, zoom)
  //   // else {
  //   //   if (centerChanged) map.panTo(center)
  //   //   if (zoomChanged) map.setZoom(zoom)
  //   // }
  // }

  render () {
    const { classes, id } = this.props
    return (
      <div
        id={ id }
        className={ classes.root }
      >
      </div>
    )
  }
}

Map.propTypes = {
  classes: PropTypes.any.isRequired,
  options: PropTypes.object.isRequired,
  id: PropTypes.string.isRequired,
  center: PropTypes.any.isRequired,
  zoom: PropTypes.any.isRequired,
  onMoveend: PropTypes.func.isRequired,
  onZoomend: PropTypes.func.isRequired,
  onClick: PropTypes.func.isRequired
}

const styles = {
  root: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    zIndex: 10
  }
}

export default withStyles(styles)(Map)
