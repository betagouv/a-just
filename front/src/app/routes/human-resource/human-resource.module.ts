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
import { CommentProfilComponent } from './comment-profil/comment-profil.component'
import { PopupModule } from 'src/app/components/popup/popup.module'

@NgModule({
  declarations: [
    HumanResourcePage,
    PanelHistoryVentilationComponent,
    ActualPanelSituationComponent,
    AddVentilationComponent,
    CoverProfilDetailsComponent,
    BigEtpPreviewComponent,
    IndispoProfilComponent,
    CommentProfilComponent,
  ],
  imports: [
    HumanResourcePageModule,
    RouterModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    MaterialModule,
    PopupModule,
  ],
})
export class HumanResourceModule {}
