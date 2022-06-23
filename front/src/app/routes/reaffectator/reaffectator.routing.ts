import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReaffectatorPage } from './reaffectator.page';

const routes: Routes = [
  {
    path: '',
    component: ReaffectatorPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReaffectatorPageModule {}
