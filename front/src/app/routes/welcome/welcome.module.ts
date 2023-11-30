import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { WelcomePage } from './welcome.page'
import { WelcomePageModule } from './welcome.routing'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module'

@NgModule({
  declarations: [
    WelcomePage,
  ],
  imports: [
    WelcomePageModule,
    RouterModule,
    WrapperNoConnectedModule,
    CommonModule,
    MaterialModule,
    WrapperModule
  ],
})
export class WelcomeModule {}
