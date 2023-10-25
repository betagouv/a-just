import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NeedMeetingPage } from './need-meeting.page';

const routes: Routes = [
  {
    path: '',
    component: NeedMeetingPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NeedMeetingPageModule {}
