import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { EtpPreviewComponent } from './etp-preview.component'

/**
 * Liste des composants à importer
 */
const list = [
  EtpPreviewComponent,
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
export class EtpPreviewModule {}
