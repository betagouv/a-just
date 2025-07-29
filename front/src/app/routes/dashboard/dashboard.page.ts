import { Component } from '@angular/core'
import { MainClass } from '../../libs/main-class'

import { WrapperComponent } from '../../components/wrapper/wrapper.component'
import { ExtractorActivityComponent } from './extractor-activity/extractor-activity.component'
import { ExtractorVentilationComponent } from './extractor-ventilation/extractor-ventilation.component'
import { UserService } from '../../services/user/user.service'
import { ExcelService } from '../../services/excel/excel.service'
import { userCanViewActivities, userCanViewContractuel, userCanViewGreffier, userCanViewMagistrat, userCanViewVentilateur } from '../../utils/user'

/**
 * Page d'extraction
 */
@Component({
  standalone: true,
  imports: [WrapperComponent, ExtractorActivityComponent, ExtractorVentilationComponent],
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
   * Peux voir le ventilateur
   */
  canViewVentilateur: boolean = false

  /**
   * Constructor
   */
  constructor(public userService: UserService, private excelService: ExcelService) {
    super()
    this.watch(
      this.userService.user.subscribe((u) => {
        this.canViewActivities = userCanViewActivities(u)
        this.canViewMagistrat = userCanViewMagistrat(u)
        this.canViewGreffier = userCanViewGreffier(u)
        this.canViewContractuel = userCanViewContractuel(u)
        this.canViewVentilateur = userCanViewVentilateur(u)
      }),
    )
    this.watch(
      this.excelService.isLoading.subscribe((b) => {
        this.isLoading = b
      }),
    )
  }

  getCacheNew(newVersion: boolean) {
    this.excelService.getCache(newVersion)
  }
}
