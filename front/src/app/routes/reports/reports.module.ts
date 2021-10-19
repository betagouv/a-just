import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReportsPage } from './reports.page';
import { ReportsPageModule } from './reports.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [ReportsPage],
  imports: [ReportsPageModule, RouterModule, ComponentsModule],
})
export class ReportsModule {}
