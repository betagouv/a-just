import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WrapperComponent } from './wrapper/wrapper.component';
import { SpeedometerComponent } from './speedometer/speedometer.component';
import { PopupComponent } from './popup/popup.component';
import { ListSelectionComponent } from './list-selection/list-selection.component';
import { PanelIndicatorComponent } from './panel-indicator/panel-indicator.page';
import { RhBackupPanelComponent } from './rh-backup-panel/rh-backup-panel.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../libs/material.module';
import { OptionsBackupPanelComponent } from './options-backup-panel/options-backup-panel.component';
import { ActivitiesBackupPanelComponent } from './activities-backup-panel/activities-backup-panel.component';
import { ReferentielCalculatorComponent } from './referentiel-calculator/referentiel-calculator.component';
import { SelectCheckAllComponent } from './select-check-all/select-check-all.component';
import { SelectComponent } from './select/select.component';
import { DateSelectComponent } from './date-select/date-select.component';
import { InputButtonComponent } from './input-button/input-button.component';

const list = [
  WrapperComponent,
  SpeedometerComponent,
  PopupComponent,
  ListSelectionComponent,
  PanelIndicatorComponent,
  RhBackupPanelComponent,
  OptionsBackupPanelComponent,
  ActivitiesBackupPanelComponent,
  ReferentielCalculatorComponent,
  SelectCheckAllComponent,
  SelectComponent,
  DateSelectComponent,
  InputButtonComponent,
];

@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MaterialModule],
  exports: list,
})
export class ComponentsModule {}
