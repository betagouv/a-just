import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { SimulatorPickerCaPage } from './simulator-picker-ca.page'
import { SimulatorPickerCaPageModule } from './simulator-picker-ca.routing'

@NgModule({
  declarations: [SimulatorPickerCaPage],
  imports: [
    SimulatorPickerCaPageModule,
    RouterModule,
    ComponentsModule,
    MaterialModule,
    CommonModule,
    WrapperModule,
  ],
})
export class SimulatorPickerCaModule {}
