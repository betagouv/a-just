import { NgModule } from '@angular/core'
import { DialWidgetComponent } from './dial-widget.component'
import { CommonModule } from '@angular/common'
import { CoveragePreviewModule } from '../coverage-preview/coverage-preview.module'

/**
 * Liste des composants à importer
 */
const list = [
  DialWidgetComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [CommonModule, CoveragePreviewModule],
  exports: [...list],
})
export class DialWidgetModule { }