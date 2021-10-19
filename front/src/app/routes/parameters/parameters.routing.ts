import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParametersPage } from './parameters.page';

const routes: Routes = [
  {
    path: '',
    component: ParametersPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParametersPageModule {}
