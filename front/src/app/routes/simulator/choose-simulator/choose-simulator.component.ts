import {
  Component,
  EventEmitter,
  HostListener,
  inject,
  Output,
} from '@angular/core';
import { MainClass } from '../../../libs/main-class';

import { UserService } from '../../../services/user/user.service';
import {
  REAFFECTATOR,
  SIMULATOR_DONNEES,
  SIMULATOR_OTHER_ACTIVITY,
} from '../../../constants/simulator';
import { MENU_HEIGHT, MENU_WIDTH } from '../../../constants/menu';
import { AppService } from '../../../services/app/app.service';

/**
 * Composant de choix du simulateur
 */
@Component({
  standalone: true,
  selector: 'app-choose-simulator',
  imports: [],
  templateUrl: './choose-simulator.component.html',
  styleUrls: ['./choose-simulator.component.scss'],
})
export class ChooseSimulatorComponent extends MainClass {
  userService = inject(UserService);
  appService = inject(AppService);
  @Output() selectedSimulatorType: EventEmitter<string> = new EventEmitter();
  /**
   * Simulateur sélectionné
   */
  selectedSimulator: string = '';
  SIMULATOR_DONNEES = SIMULATOR_DONNEES;
  SIMULATOR_OTHER_ACTIVITY = SIMULATOR_OTHER_ACTIVITY;
  REAFFECTATOR = REAFFECTATOR;
  MENU_WIDTH = MENU_WIDTH;
  MENU_HEIGHT = MENU_HEIGHT;
  /**
   * Mouse x
   */
  mouseX: number = 0;
  /**
   * Mouse y
   */
  mouseY: number = 0;

  @HostListener('window:mousemove', ['$event']) mouseMove = (
    e: MouseEvent
  ): any => {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  };

  /**
   * Constructeur
   */
  constructor() {
    super();
  }

  onSelect() {
    if (this.selectedSimulator) {
      this.selectedSimulatorType.emit(this.selectedSimulator);
    }
  }
}
