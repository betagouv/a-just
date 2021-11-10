import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AverageEtpPage } from './average-etp.page';

const routes: Routes = [
  {
    path: '',
    component: AverageEtpPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AverageEtpPageModule {}
