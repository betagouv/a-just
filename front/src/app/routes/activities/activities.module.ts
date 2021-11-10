import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ActivitiesPage } from './activities.page';
import { ActivitiesPageModule } from './activities.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [ActivitiesPage],
  imports: [ActivitiesPageModule, RouterModule, ComponentsModule],
})
export class ActivitiesModule {}
