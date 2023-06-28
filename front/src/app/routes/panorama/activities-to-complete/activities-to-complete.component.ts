import { Component, OnDestroy, OnInit } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Activités à completer
 */
@Component({
  selector: 'activities-to-complete',
  templateUrl: './activities-to-complete.component.html',
  styleUrls: ['./activities-to-complete.component.scss'],
})
export class ActivitiesToCompleteComponent extends MainClass implements OnInit, OnDestroy {


  /**
   * Constructor
   */
  constructor() {
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
