import { Component } from '@angular/core'
import { JuridictionInterface } from 'src/app/interfaces/juridiction'
import { JuridictionsService } from 'src/app/services/juridictions/juridictions.service'
import { environment } from 'src/environments/environment'

declare const mapboxgl: any

/**
 * Page de la liste des juridictions
 */

@Component({
  templateUrl: './juridictions-installed.page.html',
  styleUrls: ['./juridictions-installed.page.scss'],
})
export class JuridictionsInstalledPage {
  /**
   * Mapbox styling
   */
  style = 'mapbox://styles/fxbeta/clg6ed492002m01lafhmrc98n'
  /**
   * Center of mapbox
   */
  center: [number, number] = [2.312315, 48.8678015]
  /**
   * Zoom of mapbox
   */
  zoom: [number] = [5]
  /**
   * Liste juridictions
   */
  list: JuridictionInterface[] = []

  /**
   * Constructeur
   * @param juridictionsService
   */
  constructor(private juridictionsService: JuridictionsService) {}

  ngAfterViewInit() {
    this.juridictionsService.getAllVisible().then((l) => {
      this.list = l
      this.updateMap()
    })
  }

  updateMap() {
    mapboxgl.accessToken = environment.mapboxToken
    const map = new mapboxgl.Map({
      container: 'map-juridictions',
      style: this.style,
      zoom: this.zoom,
      center: this.center,
    })

    map.on('style.load', () => {
      this.list.map(j => {
        const sourceName = `marker-${j.id}`
        map.addSource(sourceName, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [j.longitude || 0, j.latitude || 0],
              },
            }],
          },
        })
  
        let size = (j.population || 1) / 50000
        if(size < 10) {
          size = 10
        }
        map.addLayer({
          id: `circles-${j.id}`,
          source: sourceName,
          type: 'circle',
          paint: {
            'circle-radius': size,
            'circle-color': '#000091',
            'circle-opacity': 0.5,
            'circle-stroke-width': 0,
          },
        })
      
        const m = new mapboxgl.Marker()
          .setLngLat([j.longitude || 0, j.latitude || 0])
          .addTo(map)
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`${j.label}${j.population ? '<br/>' + j.population + ' personnes' : ''}`)
        m.setPopup(popup)
      })
    })
  }
}
