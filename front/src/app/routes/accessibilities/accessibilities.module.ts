import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { AccessibilitiesPage } from './accessibilities.page'
import { AccessibilitiesPageModule } from './accessibilities.routing'
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'

@NgModule({
  declarations: [AccessibilitiesPage],
  imports: [
    AccessibilitiesPageModule,
    RouterModule,
    WrapperNoConnectedModule,
    BackButtonModule,
  ],
})
export class AccessibilitiesModule {}
