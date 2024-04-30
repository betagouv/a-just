import { NgModule } from '@angular/core'
import { EtpChartComponent } from './etp-chart.component'
import { ComponentsModule } from 'src/app/components/components.module'
import { LegendLabelModule } from '../legend-label/legend-label.module'
import { CommonModule } from '@angular/common'


/**
 * Liste des composants à importer
 */
const list = [
  EtpChartComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [ComponentsModule, LegendLabelModule, CommonModule],
  exports: [...list],
})
export class EtpChartModule { }
