import { Component } from '@angular/core';

const calculatriceTabs = ['Vacations','Volumes']
@Component({
  selector: 'aj-calculatrice',
  templateUrl: './calculatrice.component.html',
  styleUrls: ['./calculatrice.component.scss']
})
export class CalculatriceComponent {
/**
 * Choix du paneau ouvert
 */
  selectedTab = 'Vacations'

  /**
   * Ouvre l'onglet cliqué
   * @param tabName 
   */
  openTab(tabName : string) {
    this.selectedTab = tabName
  }

  radioItems = 'one two three'.split(' ');
  model = { options: 'two' };
}
