import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SimulatorsPage } from './simulators.page';
import { SimulatorsPageModule } from './simulators.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [SimulatorsPage],
  imports: [SimulatorsPageModule, RouterModule, ComponentsModule],
})
export class SimulatorsModule {}
