import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { NeedMeetingPage } from './need-meeting.page'
import { NeedMeetingPageModule } from './need-meeting.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'

@NgModule({
  declarations: [
    NeedMeetingPage,
  ],
  imports: [
    NeedMeetingPageModule,
    RouterModule,
    ComponentsModule,
    CommonModule,
    MaterialModule,
    WrapperModule,
  ],
})
export class NeedMeetingModule {}
