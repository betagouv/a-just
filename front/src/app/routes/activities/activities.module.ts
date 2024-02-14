import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ActivitiesPage } from './activities.page'
import { ActivitiesPageModule } from './activities.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { MaterialModule } from 'src/app/libs/material.module'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'
import { PopinEditActivitiesComponent } from './popin-edit-activities/popin-edit-activities.component'
import { PopupModule } from 'src/app/components/popup/popup.module'
import { CompletionBarModule } from 'src/app/components/completion-bar/completion-bar.module'

@NgModule({
  declarations: [ActivitiesPage, PopinEditActivitiesComponent],
  imports: [
    ActivitiesPageModule,
    RouterModule,
    ComponentsModule,
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    WrapperModule,
    DateSelectModule,
    PopupModule,
    CompletionBarModule,
  ],
})
export class ActivitiesModule {}
