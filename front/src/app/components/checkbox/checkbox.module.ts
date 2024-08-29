import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { CheckboxComponent } from './checkbox.component'

/**
 * Liste des composants à importer
 */
const list = [
  CheckboxComponent
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: list,
})
export class CheckboxModule { }
