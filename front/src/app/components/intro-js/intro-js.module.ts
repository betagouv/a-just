import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { IntroJSComponent } from './intro-js.component'

/**
 * Liste des composants à importer
 */
const list = [IntroJSComponent]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule],
  exports: list,
})
export class IntroJSModule {}
