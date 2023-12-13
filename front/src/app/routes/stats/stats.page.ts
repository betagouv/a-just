import { Component } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { JuridictionInterface } from 'src/app/interfaces/juridiction'
import { JuridictionsService } from 'src/app/services/juridictions/juridictions.service'
import { environment } from 'src/environments/environment'

declare let iframe : any
declare const mapboxgl: any

/**
 * Page de qui sommes nous
 */

@Component({
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
})
export class StatsPage {
  /**
   * Mapbox styling
   */
  style = environment.mapboxStyle
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
   * Liste des paramètres pour les layers à ajouter à la map pour chaques juridictions
   */
  positionMarkerSize : any[] = []

  /**
   * Taille de rayon de départ des points de localisation des juridictions sur la map
   */
  baseCircleRadius = 4

  /**
   * Constructeur
   * @param title 
   */
  constructor(private title: Title, private juridictionsService: JuridictionsService) {
    this.title.setTitle('Stats | A-Just')
  }

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
    
    /*map.on('zoom', () => {
      const currentZoom = map.getZoom();
      this.positionMarkerSize.map(elem => {
        map.setPaintProperty(elem.id, 'circle-radius', this.baseCircleRadius * Math.pow(2, currentZoom - this.zoom[0]));
      })
    })*/

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
         
          let size = (j.population || 1) / 33333
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

          /*const marker = {
            id: `circles-${j.id}`,
            source: sourceName,
            type: 'circle',
            paint: {
              'circle-radius': this.baseCircleRadius, 
              'circle-color': '#000091',
              'circle-opacity': 0.5,
              'circle-stroke-width': 0,
            },
          }

          this.positionMarkerSize.push(marker)
          map.addLayer(marker);*/

          /*const m = new mapboxgl.Marker()
          .setLngLat([j.longitude || 0, j.latitude || 0])
          .addTo(map)*/

          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`${j.label}${j.population ? '<br/>' + j.population + ' habitants' : ''}`).addTo(map)
          //m.setPopup(popup)
        })
      })
    //})
  }



  callJavascript(obj : any) {
    //iframe = obj.currentTarget.contentWindow.document
   // obj.currentTarget.style.height = obj.currentTarget.contentWindow.document.documentElement.scrollHeight + 'px';
   /*let iframe = document.getElementById('child-iframe');
   if (iframe) {
    iframe.style.minHeight = iframe.parentElement?.clientHeight + 'px';
   }*/
  }

}
