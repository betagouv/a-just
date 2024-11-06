import { Component } from '@angular/core'
import { DocumentationInterface } from 'src/app/interfaces/documentation'
import { Router } from '@angular/router'
import { MainClass } from 'src/app/libs/main-class'

/**
 * Composant page simulateur
 */
@Component({
  templateUrl: './simulator-picker-ca.page.html',
  styleUrls: ['./simulator-picker-ca.page.scss'],
})
export class SimulatorPickerCaPage extends MainClass {
  /**
   * Documentation widget
   */
  documentation: DocumentationInterface = {
    title: 'Simulateur A-JUST :',
    path: 'https://docs.a-just.beta.gouv.fr/documentation-deploiement/simulateur/quest-ce-que-cest',
    printSubTitle: true,
  }

  constructor(private router: Router) {
    super()
  }

  /**
   * Go to simulateur a blanc
   */
  changePage() {
    window.location.href = 'simulateur-sans-donnees'
  }
}
