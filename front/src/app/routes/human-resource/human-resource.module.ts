import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { HumanResourcePage } from './human-resource.page'
import { HumanResourcePageModule } from './human-resource.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { PanelHistoryVentilationComponent } from './panel-history-ventilation/panel-history-ventilation.component'
import { ActualPanelSituationComponent } from './actual-panel-situation/actual-panel-situation.component'
import { AddVentilationComponent } from './add-ventilation/add-ventilation.component'
import { CoverProfilDetailsComponent } from './cover-profil-details/cover-profil-details.component'
import { BigEtpPreviewComponent } from './big-etp-preview/big-etp-preview.component'
import { IndispoProfilComponent } from './indispo-profil/indispo-profil.component'
import { PopupModule } from 'src/app/components/popup/popup.module'
import { EtpPreviewModule } from 'src/app/components/etp-preview/etp-preview.module'
import { PanelActivitiesModule } from 'src/app/components/panel-activities/panel-activities.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { TextEditorModule } from 'src/app/components/text-editor/text-editor.module'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'
import { HelpButtonModule } from 'src/app/components/help-button/help-button.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'
import { CommentProfilModule } from './comment-profil/comment-profil.module'

@NgModule({
  declarations: [
    HumanResourcePage,
    PanelHistoryVentilationComponent,
    ActualPanelSituationComponent,
    AddVentilationComponent,
    CoverProfilDetailsComponent,
    BigEtpPreviewComponent,
    IndispoProfilComponent,
  ],
  imports: [
    CommentProfilModule,
    HumanResourcePageModule,
    RouterModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule,
    PopupModule,
    EtpPreviewModule,
    PanelActivitiesModule,
    WrapperModule,
    TextEditorModule,
    DateSelectModule,
    HelpButtonModule,
    BackButtonModule
  ],
})
export class HumanResourceModule { }
