import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { PanelActivitiesComponent } from './panel-activities.component'
import { ProgressionBarComponent } from './progression-bar/progression-bar.component'

/**
 * Liste des composants à importer
 */
const list = [
  PanelActivitiesComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list, ProgressionBarComponent],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: list,
})
export class PanelActivitiesModule {}
