import L from 'leaflet'
import * as R from 'ramda'
import { arc } from '../features/geo-helper'
import { shape } from '../features/react-shape'
import '../features/Arc'

const RTN = L.TACGRP.Arc.extend({

  _shape (group, options) {
    return shape(group, options, {
      points: ({ C, radius, radians }) => {
        const steps = 32
        const delta = radians.delta / steps
        const xs = R.range(0, steps + 1).map(x => radians.start + x * delta)

        const outer = arc(C, radius * 1.2)(xs)
        const inner = arc(C, radius)(xs)

        const spikes = []
        for (let i = 1; i < inner.length - 1; i++) {
          spikes.push([inner[i], outer[i]])
        }

        return [
          inner, ...spikes,
          this._arrow(inner[inner.length - 1], radians.end, radius / 5)
        ]
      }
    })
  }
})

L.Feature['G*T*Q-----'] = (feature, options) => {
  options.labels = () => {
    const alpha = radians => radians.start + radians.delta / 2
    return [{
      placement: ({ C, radius, radians }) => arc(C, radius)([alpha(radians)])[0],
      lines: ['R'],
      'font-size': 18,
      angle: ({ radians }) => alpha(radians) / Math.PI * 180
    }]
  }

  return new RTN(feature, options)
}
