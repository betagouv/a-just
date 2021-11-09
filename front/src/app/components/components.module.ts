import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WrapperComponent } from './wrapper/wrapper.component';
import { SpeedometerComponent } from './speedometer/speedometer.component';
import { PopupComponent } from './popup/popup.component';
import { ListSelectionComponent } from './list-selection/list-selection.component';
import { PanelIndicatorComponent } from './panel-indicator/panel-indicator.page';
import { BackupPanelComponent } from './backup-panel/backup-panel.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const list = [
  WrapperComponent,
  SpeedometerComponent,
  PopupComponent,
  ListSelectionComponent,
  PanelIndicatorComponent,
  BackupPanelComponent,
];

@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  exports: list,
})
export class ComponentsModule {}
