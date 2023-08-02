import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { MaterialModule } from 'src/app/libs/material.module'
import { FormsModule } from '@angular/forms'
import { PipesModule } from 'src/app/pipes/pipes.module'
import { TextEditorComponent } from './text-editor.component'

/**
 * Liste des composants à importer
 */
const list = [
  TextEditorComponent,
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
    FormsModule,
    PipesModule
  ],
  exports: list,
})
export class TextEditorModule {}
