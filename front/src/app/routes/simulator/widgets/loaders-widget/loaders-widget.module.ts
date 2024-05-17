import { NgModule } from '@angular/core'
import { LoadersWidgetComponent } from './loaders-widget.component'
import { CommonModule } from '@angular/common'

/**
 * Liste des composants à importer
 */
const list = [
  LoadersWidgetComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [CommonModule],
  exports: [...list],
})
export class LoadersWidgetModule { }