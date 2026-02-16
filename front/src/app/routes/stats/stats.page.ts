import { Component, inject } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { BackButtonComponent } from '../../components/back-button/back-button.component'
import { JuridictionInterface } from '../../interfaces/juridiction'
import { JuridictionsService } from '../../services/juridictions/juridictions.service'
import { UserService } from '../../services/user/user.service'

declare let iframe: any
declare const mapboxgl: any

/**
 * Page de qui sommes nous
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage {
  title = inject(Title)
  juridictionsService = inject(JuridictionsService)
  userService = inject(UserService)
  /**
   * Mapbox styling
   */
  style = import.meta.env.NG_APP_MAPBOX_STYLE
  /**
   * Center of mapbox
   */
  center: [number, number] = [2.213749, 46.227638]
  /**
   * Zoom of mapbox
   */
  zoom: [number] = [4.7]
  /**
   * Liste juridictions
   */
  list: JuridictionInterface[] = []
  /**
   * Mapbox Token
   */
  mapboxToken = import.meta.env.NG_APP_MAPBOX_TOKEN

  /**
   * Constructeur
   * @param title
   */
  constructor() {
    this.title.setTitle((this.userService.isCa() ? 'A-Just CA | ' : 'A-Just TJ | ') + 'Stats')
  }

  ngAfterViewInit() {
    this.juridictionsService.getAllVisible().then((l) => {
      this.list = l
      this.updateMap()
    })
  }

  updateMap() {

    mapboxgl.accessToken = this.mapboxToken
    const map = new mapboxgl.Map({
      container: 'map-juridictions',
      style: this.style,
      zoom: this.zoom,
      center: this.center,
    })
    
    map.on('style.load', () => {
      this.list.map((j) => {
        const sourceName = `marker-${j.id}`
        map.addSource(sourceName, {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [j.longitude || 0, j.latitude || 0],
                },
              },
            ],
          },
        })

        let size = (j.population || 1) / 33333
        if (size < 10) {
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

        const m = new mapboxgl.Marker().setLngLat([j.longitude || 0, j.latitude || 0]).addTo(map)
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`${j.label}${j.population ? '<br/>' + j.population + ' habitants' : ''}`)
        m.setPopup(popup)
      })
    })
    
  }

  callJavascript(obj: any) {
    //iframe = obj.currentTarget.contentWindow.document
    // obj.currentTarget.style.height = obj.currentTarget.contentWindow.document.documentElement.scrollHeight + 'px';
    let iframe = document.getElementById('child-iframe')
    if (iframe) {
      iframe.style.height = iframe.parentElement?.scrollHeight + 'px'
    }
  }
}
