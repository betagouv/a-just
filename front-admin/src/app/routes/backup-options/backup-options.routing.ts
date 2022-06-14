import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BackupOptionsPage } from './backup-options.page';

const routes: Routes = [
  {
    path: '',
    component: BackupOptionsPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class BackupOptionsPageModule {}
