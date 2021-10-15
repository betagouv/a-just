import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HelpsPage } from './helps.page';

const routes: Routes = [
  {
    path: '',
    component: HelpsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HelpsPageModule {}
