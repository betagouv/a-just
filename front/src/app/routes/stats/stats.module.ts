import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { StatsPage } from './stats.page'
import { StatsPageModule } from './stats.routing'
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'

@NgModule({
  declarations: [StatsPage],
  imports: [
    StatsPageModule,
    RouterModule,
    WrapperNoConnectedModule,
    BackButtonModule,
  ],
})
export class StatsModule {}
