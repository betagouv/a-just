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
import { BackButtonModule } from 'src/app/components/back-button/back-button.module';
import { CheckboxModule } from 'src/app/components/checkbox/checkbox.module'
import { PipesModule } from 'src/app/pipes/pipes.module'
import { PopupModule } from 'src/app/components/popup/popup.module'

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
    BackButtonModule,
    CheckboxModule,
    PipesModule,
    PopupModule
  ],
})
export class AverageEtpModule { }
