import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { WorkforcePage } from './workforce.page'
import { WorkforcePageModule } from './workforce.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MaterialModule } from 'src/app/libs/material.module'
import { FilterPanelComponent } from './filter-panel/filter-panel.component'
import { NgSelectModule } from '@ng-select/ng-select'
import { PipesModule } from 'src/app/pipes/pipes.module'
import { PersonPreviewComponent } from './person-preview/person-preview.component'
import { EtpPreviewModule } from 'src/app/components/etp-preview/etp-preview.module'
import { PanelActivitiesModule } from 'src/app/components/panel-activities/panel-activities.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { SelectModule } from 'src/app/components/select/select.module'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'
import { InputButtonModule } from 'src/app/components/input-button/input-button.module'

@NgModule({
  declarations: [WorkforcePage, FilterPanelComponent, PersonPreviewComponent],
  imports: [
    WorkforcePageModule,
    NgSelectModule,
    RouterModule,
    ComponentsModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PipesModule,
    EtpPreviewModule,
    PanelActivitiesModule,
    WrapperModule,
    SelectModule,
    DateSelectModule,
    InputButtonModule
  ],
})
export class WorkforceModule {}
