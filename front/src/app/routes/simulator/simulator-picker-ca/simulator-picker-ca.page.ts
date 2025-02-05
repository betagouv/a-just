import { Component, inject } from '@angular/core';
import { MainClass } from '../../../libs/main-class';
import { DocumentationInterface } from '../../../interfaces/documentation';
import { WrapperComponent } from '../../../components/wrapper/wrapper.component';
import { UserService } from '../../../services/user/user.service';

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
  userService = inject(UserService);
  /**
   * Documentation widget
   */
  documentation: DocumentationInterface = {
    title: 'Simulateur A-JUST :',
    path: this.userService.isCa()
      ? 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/simulateur-sans-donnees-pre-alimentees/quest-ce-que-cest'
      : 'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just/simulateur-sans-donnees-pre-alimentees/quest-ce-que-cest',
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
