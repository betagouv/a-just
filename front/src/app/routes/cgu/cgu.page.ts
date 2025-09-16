import { Component, inject, OnInit } from '@angular/core'
import { Title } from '@angular/platform-browser'
import { ActivatedRoute, Router } from '@angular/router'
import { MainClass } from '../../libs/main-class'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { BackButtonComponent } from '../../components/back-button/back-button.component'

/**
 * CGU
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './cgu.page.html',
  styleUrls: ['./cgu.page.scss'],
})
export class CGUPage extends MainClass implements OnInit {
  /**
   * Service de gestion du titre
   */
  title = inject(Title)
  /**
   * Service de gestion des paramètres de l'URL
   */
  route = inject(ActivatedRoute)
  /**
   * url en cours
   */
  hasTrailingSlash: boolean = true
  /**
   * Back link
   */
  backLink = '/'
  /**
   * Constructeur
   * @param title
   */
  constructor(public router: Router) {
    super()
    if (this.route.snapshot.queryParamMap.get('noBack') === 'true') this.hasTrailingSlash = false
    this.title.setTitle("Conditions générales d'utilisation | A-Just")
  }

  /**
   * Au chargement récupération des variables globales + chargement
   */
  ngOnInit() {
    this.watch(
      this.route.params.subscribe((params) => {
        if (params['backPath'] === 'signUp') {
          console.log('PARAM', params['backPath'])
          this.backLink = '/inscription'
        }
      }),
    )
  }
}
