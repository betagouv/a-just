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

const list = [
  WrapperComponent,
  SpeedometerComponent,
  PopupComponent,
  ListSelectionComponent,
  PanelIndicatorComponent,
  RhBackupPanelComponent,
  OptionsBackupPanelComponent,
  ActivitiesBackupPanelComponent,
];

@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MaterialModule],
  exports: list,
})
export class ComponentsModule {}
