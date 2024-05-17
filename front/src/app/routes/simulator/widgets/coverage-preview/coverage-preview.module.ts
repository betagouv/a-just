import { NgModule } from '@angular/core'
import { CoveragePreviewComponent } from './coverage-preview.component'
import { CommonModule } from '@angular/common'

/**
 * Liste des composants à importer
 */
const list = [
  CoveragePreviewComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [CommonModule],
  exports: [...list],
})
export class CoveragePreviewModule { }