import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ActivitiesPage } from './activities.page';
import { ActivitiesPageModule } from './activities.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { MaterialModule } from 'src/app/libs/material.module';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [ActivitiesPage],
  imports: [ActivitiesPageModule, RouterModule, ComponentsModule, MaterialModule, CommonModule],
})
export class ActivitiesModule {}
