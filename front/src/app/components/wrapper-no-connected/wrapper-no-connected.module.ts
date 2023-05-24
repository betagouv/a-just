import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { WrapperNoConnectedComponent } from './wrapper-no-connected.component'
import { FooterNoConnectedComponent } from './footer-no-connected/footer-no-connected.component'

/**
 * Liste des composants à importer
 */
const list = [
  WrapperNoConnectedComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list, FooterNoConnectedComponent],
  imports: [
    CommonModule,
    RouterModule,
  ],
  exports: list,
})
export class WrapperNoConnectedModule {}
