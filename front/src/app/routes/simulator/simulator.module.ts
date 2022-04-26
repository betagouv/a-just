import { NgModule } from '@angular/core';
import { SimulatorPageModule } from './simulator.routing';
import { SimulatorPage } from './simulator.page';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { MaterialModule } from 'src/app/libs/material.module';


@NgModule({
  declarations: [SimulatorPage],
  imports: [ SimulatorPageModule, RouterModule, ComponentsModule, MaterialModule]
})
export class SimulatorModule { }
