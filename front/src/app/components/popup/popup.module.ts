import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { PopupComponent } from './popup.component'

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
  ],
  exports: list,
})
export class PopupModule {}
