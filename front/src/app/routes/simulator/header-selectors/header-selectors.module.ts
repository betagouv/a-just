import { NgModule } from '@angular/core'
import { ComponentsModule } from 'src/app/components/components.module'
import { HeaderSelectorsComponent } from './header-selectors.component'
import { MaterialModule } from 'src/app/libs/material.module'
import { PeriodSelectorModule } from '../period-selector/period-selector.module'
import { CommonModule } from '@angular/common'
import { SelectModule } from 'src/app/components/select/select.module'

/**
 * Liste des composants à importer
 */
const list = [HeaderSelectorsComponent]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [ComponentsModule, MaterialModule, CommonModule, PeriodSelectorModule, SelectModule],
  exports: [...list],
})
export class HeaderSelectorsModule {}
