import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { AverageEtpPage } from './average-etp.page'
import { AverageEtpPageModule } from './average-etp.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SelectModule } from 'src/app/components/select/select.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'

@NgModule({
  declarations: [AverageEtpPage],
  imports: [
    AverageEtpPageModule,
    CommonModule,
    RouterModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SelectModule,
    WrapperModule,
    BackButtonModule
  ],
})
export class AverageEtpModule {}
