import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HelpButtonComponent } from '../../../components/help-button/help-button.component';
import { MainClass } from '../../../libs/main-class';
import { RHActivityInterface } from '../../../interfaces/rh-activity';
import { MatIconModule } from '@angular/material/icon';

/**
 * Panneau de présentation d'une fiche
 */

@Component({
  selector: 'indispo-profil',
  standalone: true,
  imports: [CommonModule, HelpButtonComponent, MatIconModule],
  templateUrl: './indispo-profil.component.html',
  styleUrls: ['./indispo-profil.component.scss'],
})
export class IndispoProfilComponent extends MainClass {
  /**
   * Liste des indispo courrante
   */
  @Input() indisponibilities: RHActivityInterface[] = [];
  /**
   * Request to open help panel
   */
  @Output() onOpenHelpPanel = new EventEmitter();
  /**
   * Event lors du choix d'ajouter une indispo
   */
  @Output() addIndispiniblity = new EventEmitter();

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  /**
   * Force to open help panel
   * @param type
   */
  openHelpPanel(type: string | undefined = undefined) {
    this.onOpenHelpPanel.emit(type);
  }
}
