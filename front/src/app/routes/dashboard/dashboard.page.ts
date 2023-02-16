import { Component } from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'
import { ExcelService } from 'src/app/services/excel/excel.service'
import { UserService } from 'src/app/services/user/user.service'
import {
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
   * Constructor
   */
  constructor(){
  super()}
}
