import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { WelcomePage } from './welcome.page'
import { WelcomePageModule } from './welcome.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { PipesModule } from 'src/app/pipes/pipes.module'

@NgModule({
  declarations: [
    WelcomePage,
  ],
  imports: [
    WelcomePageModule,
    RouterModule,
    ComponentsModule,
    CommonModule,
    MaterialModule,
    WrapperModule,
    PipesModule
  ],
})
export class WelcomeModule {}
