import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { DashboardPage } from './dashboard.page'
import { DashboardPageModule } from './dashboard.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { MaterialModule } from 'src/app/libs/material.module'
import { CommonModule } from '@angular/common'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'

@NgModule({
  declarations: [DashboardPage],
  imports: [
    DashboardPageModule,
    RouterModule,
    ComponentsModule,
    MaterialModule,
    CommonModule,
    WrapperModule
  ],
})
export class DashboardModule {}
