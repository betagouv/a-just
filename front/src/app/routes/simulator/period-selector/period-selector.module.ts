import { NgModule } from '@angular/core'
import { ComponentsModule } from 'src/app/components/components.module'
import { PeriodSelectorComponent } from './period-selector.component'
import { SelectComponent } from 'src/app/components/select/select.component'
import { SelectModule } from 'src/app/components/select/select.module'
import { DateSelectBlueComponent } from 'src/app/components/date-select-blue/date-select-blue.component'
import { MaterialModule } from 'src/app/libs/material.module'
import { CommonModule } from '@angular/common'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'
import { RouterModule } from '@angular/router'

/**
 * Liste des composants à importer
 */
const list = [PeriodSelectorComponent]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [
    ComponentsModule,
    RouterModule,
    ComponentsModule,
    MaterialModule,
    CommonModule,
  ],
  exports: [...list],
})
export class PeriodSelectorModule {}
