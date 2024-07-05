import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { DateSelectDoubleComponent } from './date-select-double.component'
import { MaterialModule } from 'src/app/libs/material.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

/**
 * Liste des composants à importer
 */
const list = [
  DateSelectDoubleComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    ReactiveFormsModule,
    FormsModule
  ],
  exports: list,
})
export class DateSelectDoubleModule { }
