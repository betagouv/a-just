import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AverageEtpDisplayerPage } from './average-etp-displayer.page';

const routes: Routes = [
  {
    path: ':id',
    component: AverageEtpDisplayerPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AverageEtpDisplayerPageModule { }
