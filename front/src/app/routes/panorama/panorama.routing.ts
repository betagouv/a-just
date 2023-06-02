import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PanoramaPage } from './panorama.page';

const routes: Routes = [
  {
    path: '',
    component: PanoramaPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PanoramaPageModule {}
