import { NgModule } from '@angular/core'
import { ComponentsModule } from 'src/app/components/components.module'
import { ExtractorVentilationComponent } from './extractor-ventilation.component'
import { MaterialModule } from 'src/app/libs/material.module'
import { SelectModule } from 'src/app/components/select/select.module'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'

/**
 * Liste des composants à importer
 */
const list = [
  ExtractorVentilationComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [ComponentsModule, MaterialModule, SelectModule, DateSelectModule],
  exports: [...list],
})
export class ExtractorVentilationModule { }