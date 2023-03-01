import { Component } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { ExcelService } from 'src/app/services/excel/excel.service'
import { UserService } from 'src/app/services/user/user.service'
import {
  userCanViewActivities,
  userCanViewContractuel,
  userCanViewGreffier,
  userCanViewMagistrat,
} from 'src/app/utils/user'

/**
 * Page d'extraction
 */
@Component({
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage extends MainClass {
  /**
   * Loader
   */
  isLoading: boolean = false
  /**
   * Droit pour accéder aux données d'activité
   */
  canViewActivities: boolean = false
  /**
   * Peux voir l'interface magistrat
   */
  canViewMagistrat: boolean = false
  /**
   * Peux voir l'interface greffier
   */
  canViewGreffier: boolean = false
  /**
   * Peux voir l'interface contractuel
   */
  canViewContractuel: boolean = false

  /**
   * Constructor
   */
  constructor(private userService: UserService){
  super()
  this.watch(
    this.userService.user.subscribe((u) => {
      this.canViewActivities = userCanViewActivities(u)
      this.canViewMagistrat = userCanViewMagistrat(u)
      this.canViewGreffier = userCanViewGreffier(u)
      this.canViewContractuel = userCanViewContractuel(u)
    })
  )
}

}
