import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { AboutUsPage } from './about-us.page'
import { AboutUsPageModule } from './about-us.routing'
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'

@NgModule({
  declarations: [AboutUsPage],
  imports: [
    AboutUsPageModule,
    RouterModule,
    WrapperNoConnectedModule,
    BackButtonModule,
  ],
})
export class AboutUsModule {}
