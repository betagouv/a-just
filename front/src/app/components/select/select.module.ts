import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { SelectComponent } from './select.component'
import { MaterialModule } from 'src/app/libs/material.module'
import { SelectCheckAllComponent } from './select-check-all/select-check-all.component'
import { FormsModule } from '@angular/forms'
import { PipesModule } from 'src/app/pipes/pipes.module'

/**
 * Liste des composants à importer
 */
const list = [
  SelectComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list, SelectCheckAllComponent],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    FormsModule,
    PipesModule
  ],
  exports: list,
})
export class SelectModule {}
