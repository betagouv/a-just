import { NgModule } from '@angular/core'
import { DtesChartComponent } from './dtes-chart.component'
import { LegendLabelModule } from '../legend-label/legend-label.module'
import { ComponentsModule } from 'src/app/components/components.module'

/**
 * Liste des composants à importer
 */
const list = [
  DtesChartComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [ComponentsModule, LegendLabelModule],
  exports: [...list],
})
export class DtesChartModule { }