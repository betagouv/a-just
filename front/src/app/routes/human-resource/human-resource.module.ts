import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HumanResourcePage } from './human-resource.page';
import { HumanResourcePageModule } from './human-resource.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/libs/material.module';
import { PanelHistoryVentilationComponent } from './panel-history-ventilation/panel-history-ventilation.component';
import { ActualPanelSituationComponent } from './actual-panel-situation/actual-panel-situation.component';
import { AddVentilationComponent } from './add-ventilation/add-ventilation.component';
import { CoverProfilDetailsComponent } from './cover-profil-details/cover-profil-details.component';

@NgModule({
  declarations: [HumanResourcePage, PanelHistoryVentilationComponent, ActualPanelSituationComponent, AddVentilationComponent, CoverProfilDetailsComponent],
  imports: [HumanResourcePageModule, RouterModule, ComponentsModule, FormsModule, ReactiveFormsModule, CommonModule, MaterialModule],
})
export class HumanResourceModule {}
