import { Component, OnDestroy, OnInit } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'
import { userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat } from 'src/app/utils/user'

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'panorama-effectif',
  templateUrl: './panorama-effectif.component.html',
  styleUrls: ['./panorama-effectif.component.scss'],
})
export class PanoramaEffectifComponent extends MainClass implements OnInit, OnDestroy {


  /**
   * Constructor
   */
  constructor(private userService: UserService) {
    super()
  }

   /**
   * Initialisation des datas au chargement de la page
   */
   ngOnInit() {
  }

  /**
   * Destruction du composant
   */
  ngOnDestroy() {
  }
}
