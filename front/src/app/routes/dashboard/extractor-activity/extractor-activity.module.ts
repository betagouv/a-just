import { NgModule } from '@angular/core'
import { ComponentsModule } from 'src/app/components/components.module'
import { ExtractorActivityComponent } from './extractor-activity.component'
import { MaterialModule } from 'src/app/libs/material.module'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'

/**
 * Liste des composants à importer
 */
const list = [
  ExtractorActivityComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [ComponentsModule, MaterialModule, DateSelectModule],
  exports: [...list],
})
export class ExtractorActivityModule { }