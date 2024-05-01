import { NgModule } from '@angular/core'
import { ComponentsModule } from 'src/app/components/components.module'
import { EditableSituationComponent } from './editable-situation.component'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

/**
 * Liste des composants à importer
 */
const list = [
  EditableSituationComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [
    ComponentsModule,
    CommonModule,
    FormsModule,
    MaterialModule,
    ReactiveFormsModule
  ],
  exports: [...list],
})
export class EditableSituationModule { }