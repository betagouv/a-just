import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { HelpCenterPageModule } from './help-center.routing'
import { HelpCenterPage } from './help-center.page'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { MaterialModule } from 'src/app/libs/material.module'
import { InputButtonModule } from 'src/app/components/input-button/input-button.module'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { ComponentsModule } from 'src/app/components/components.module'
import { PipesModule } from 'src/app/pipes/pipes.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'

@NgModule({
  declarations: [HelpCenterPage],
  imports: [
    PipesModule,
    HelpCenterPageModule,
    RouterModule,
    WrapperModule,
    MaterialModule,
    InputButtonModule,
    CommonModule,
    FormsModule,
    ComponentsModule,
    BackButtonModule,
  ],
})
export class HelpCenterModule {}
