import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HumanResourcePage } from './human-resource.page';

const routes: Routes = [
  {
    path: ':id',
    component: HumanResourcePage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class HumanResourcePageModule {}
