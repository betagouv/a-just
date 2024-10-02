import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { SpeedometerComponent } from './speedometer.component'
import { ComponentsModule } from '../components.module'

/**
 * Liste des composants à importer
 */
const list = [
  SpeedometerComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [
    CommonModule,
    RouterModule,
    ComponentsModule
  ],
  exports: list,
})
export class SpeedometerModule {}
