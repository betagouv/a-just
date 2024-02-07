import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReferentielPage } from './referentiel.page';

const routes: Routes = [
  {
    path: '',
    component: ReferentielPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReferentielPageModule {}
