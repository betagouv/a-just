import { NgModule } from '@angular/core'
import { InOutChartComponent } from './in-out-chart.component'
import { LegendLabelModule } from '../legend-label/legend-label.module'
import { CommonModule } from '@angular/common'
import { ComponentsModule } from 'src/app/components/components.module'

/**
 * Liste des composants à importer
 */
const list = [
  InOutChartComponent,

]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [ComponentsModule, LegendLabelModule, ComponentsModule],
  exports: [...list],
})
export class InOutChartModule { }