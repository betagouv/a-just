import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { SimulatorPickerCaPage } from './simulator-picker-ca.page'

const routes: Routes = [
  {
    path: '',
    component: SimulatorPickerCaPage,
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SimulatorPickerCaPageModule {}
