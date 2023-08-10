import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { InputButtonComponent } from './input-button.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MaterialModule } from 'src/app/libs/material.module'

/**
 * Liste des composants à importer
 */
const list = [
  InputButtonComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  exports: list,
})
export class InputButtonModule {}
