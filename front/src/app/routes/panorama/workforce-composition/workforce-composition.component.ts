import { Component, Input, OnDestroy, OnInit } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { UserService } from 'src/app/services/user/user.service'
import { HRCategorySelectedInterface } from 'src/app/interfaces/hr-category'

/**
 * Page de la liste des fiches (magistrats, greffier ...)
 */
@Component({
  selector: 'workforce-composition',
  templateUrl: './workforce-composition.component.html',
  styleUrls: ['./workforce-composition.component.scss'],
})
export class WorkforceCompositionComponent extends MainClass implements OnInit, OnDestroy {

  @Input() workforce: HRCategorySelectedInterface[] = []

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
