import { Component } from '@angular/core';
import { MainClass } from '../../../libs/main-class';
import { DocumentationInterface } from '../../../interfaces/documentation';
import { WrapperComponent } from '../../../components/wrapper/wrapper.component';

/**
 * Composant page simulateur
 */
@Component({
  standalone: true,
  imports: [WrapperComponent],
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
  };

  constructor() {
    super();
  }

  /**
   * Go to simulateur a blanc
   */
  changePage() {
    window.location.href = 'simulateur-sans-donnees';
  }
}
