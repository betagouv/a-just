import { NgModule } from '@angular/core'
import { ComponentsModule } from 'src/app/components/components.module'
import { SituationDisplayerComponent } from './situation-displayer.component'
import { MatTooltipModule } from '@angular/material/tooltip'
import { PeriodSelectorModule } from '../period-selector/period-selector.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { RouterModule } from '@angular/router'

/**
 * Liste des composants à importer
 */
const list = [SituationDisplayerComponent]

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
    PeriodSelectorModule,
  ],
  exports: [...list],
})
export class SituationDisplayerModule {}
