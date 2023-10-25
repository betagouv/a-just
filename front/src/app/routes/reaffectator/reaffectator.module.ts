import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ReaffectatorPage } from './reaffectator.page'
import { ReaffectatorPageModule } from './reaffectator.routing'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { PipesModule } from 'src/app/pipes/pipes.module'
import { PopupModule } from 'src/app/components/popup/popup.module'
import { PanelActivitiesModule } from 'src/app/components/panel-activities/panel-activities.module'
import { EtpPreviewModule } from 'src/app/components/etp-preview/etp-preview.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SpeedometerModule } from 'src/app/components/speedometer/speedometer.module'
import { SelectModule } from 'src/app/components/select/select.module'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'
import { InputButtonModule } from 'src/app/components/input-button/input-button.module'
import { MatIconModule } from '@angular/material/icon'

@NgModule({
  declarations: [ReaffectatorPage],
  imports: [
    ReaffectatorPageModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    PipesModule,
    PopupModule,
    PanelActivitiesModule,
    EtpPreviewModule,
    WrapperModule,
    SpeedometerModule,
    SelectModule,
    DateSelectModule,
    InputButtonModule,
    MatIconModule
  ],
})
export class ReaffectatorModule {}
