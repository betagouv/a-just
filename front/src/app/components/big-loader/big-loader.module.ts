import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { BigLoaderComponent } from './big-loader.component'

/**
 * Liste des composants à importer
 */
const list = [
  BigLoaderComponent
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
export class BigLoaderModule { }
