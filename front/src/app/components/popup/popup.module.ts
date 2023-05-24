import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { PopupComponent } from './popup.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MaterialModule } from 'src/app/libs/material.module'
import { PipesModule } from 'src/app/pipes/pipes.module'
import { NgSelectModule } from '@ng-select/ng-select'

/**
 * Liste des composants à importer
 */
const list = [
  PopupComponent
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
    MaterialModule,
    PipesModule,
    NgSelectModule,
  ],
  exports: list,
})
export class PopupModule {}
