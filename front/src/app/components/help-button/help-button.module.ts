import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { HelpButtonComponent } from './help-button.component'

/**
 * Liste des composants à importer
 */
const list = [
  HelpButtonComponent,
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
export class HelpButtonModule {}