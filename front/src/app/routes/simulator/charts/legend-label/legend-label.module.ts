import { NgModule } from '@angular/core'
import { LegendLabelComponent } from './legend-label.component'
import { ComponentsModule } from 'src/app/components/components.module'

/**
 * Liste des composants à importer
 */
const list = [
  LegendLabelComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [ComponentsModule],
  exports: [...list, ComponentsModule],
})
export class LegendLabelModule { }