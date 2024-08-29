import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SelectModule } from 'src/app/components/select/select.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module';
import { AverageEtpDisplayerPage } from './average-etp-displayer.page'
import { AverageEtpDisplayerPageModule } from './average-etp-displayer.routing'
import { PopupModule } from 'src/app/components/popup/popup.module'


@NgModule({
  declarations: [AverageEtpDisplayerPage],
  imports: [
    CommonModule,
    RouterModule,
    ComponentsModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SelectModule,
    WrapperModule,
    BackButtonModule,
    AverageEtpDisplayerPageModule,
    BackButtonModule,
    PopupModule
  ],
})
export class AverageEtpDisplayerModule { }
