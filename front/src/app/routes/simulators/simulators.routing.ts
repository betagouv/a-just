import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SimulatorsPage } from './simulators.page';

const routes: Routes = [
  {
    path: '',
    component: SimulatorsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SimulatorsPageModule {}
