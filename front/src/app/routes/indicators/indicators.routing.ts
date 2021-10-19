import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndicatorsPage } from './indicators.page';

const routes: Routes = [
  {
    path: '',
    component: IndicatorsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class IndicatorsPageModule {}
