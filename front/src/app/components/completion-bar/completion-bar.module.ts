import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { CompletionBarComponent } from './completion-bar.component'

/**
 * Liste des composants à importer
 */
const list = [
  CompletionBarComponent,
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
export class CompletionBarModule {}
