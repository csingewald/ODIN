import React from 'react'
import { PropTypes } from 'prop-types'
import { Card, CardContent, Typography } from '@material-ui/core'

import WMTSLayerTable from './WMTSLayerTable'
import WMTSCapabilities from 'ol/format/WMTSCapabilities'

const WMTSOptions = props => {
  const { merge, onValidation } = props

  /* effects */
  const [capabilities, setCapabilities] = React.useState(null)
  const [selectedLayerId, setSelectedLayerId] = React.useState(props.options.layer)

  React.useEffect(() => {
    const controller = new AbortController()
    const signal = controller.signal

    const fetchAndSetCapabilities = async () => {
      try {
        const response = await fetch(props.options.url, { signal })
        const caps = (new WMTSCapabilities()).read(await response.text())
        console.dir(caps)
        setCapabilities(caps)
      } catch (error) {
        console.error(error)
        setCapabilities(null)
      }
    }
    fetchAndSetCapabilities()

    onValidation(!!props.options.layer)
    return () => { controller.abort() }
  }, [])

  /* increases performance */
  const layers = React.useMemo(() => {
    const MAX_ABSTRACT_LENGTH = 140
    if (!capabilities) return []
    return capabilities.Contents.Layer.map(layer => {
      return {
        Identifier: layer.Identifier,
        Title: layer.Title,
        Abstract: (
          layer.Abstract.length > MAX_ABSTRACT_LENGTH
            ? `${layer.Abstract.substring(0, MAX_ABSTRACT_LENGTH)} ...`
            : layer.Abstract
        )
      }
    })
  }, [capabilities])


  /* functions */
  const handleLayerSelected = layerId => {
    console.log(`layer ${layerId} was selected`)
    if (layerId) {
      setSelectedLayerId(layerId)
      merge('layer', layerId)
      onValidation(true)
    } else {
      onValidation(false)
    }
  }

  /* rendering */
  if (!capabilities) return <div>Loading data ...</div>

  return (
    <>
      <Card variant="outlined">
        <CardContent>
          <Typography gutterBottom>{capabilities.ServiceProvider.ProviderName}</Typography>
          <Typography gutterBottom variant="h5" component="h2">{capabilities.ServiceIdentification.Title}</Typography>
          <Typography gutterBottom >{capabilities.ServiceIdentification.Abstract}</Typography>
        </CardContent>
      </Card>
      <WMTSLayerTable
        layers={layers}
        selectedLayerIdentifier={selectedLayerId}
        onLayerSelected={handleLayerSelected}
      />
    </>
  )
}
WMTSOptions.propTypes = {
  options: PropTypes.object,
  merge: PropTypes.func,
  onValidation: PropTypes.func
}

export default WMTSOptions
