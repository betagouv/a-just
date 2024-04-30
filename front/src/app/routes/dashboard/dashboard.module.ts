import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { DashboardPage } from './dashboard.page'
import { DashboardPageModule } from './dashboard.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { MaterialModule } from 'src/app/libs/material.module'
import { CommonModule } from '@angular/common'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { ExtractorActivityModule } from './extractor-activity/extractor-activity.module'
import { ExtractorVentilationModule } from './extractor-ventilation/extractor-ventilation.module'

@NgModule({
  declarations: [DashboardPage],
  imports: [
    DashboardPageModule,
    RouterModule,
    ComponentsModule,
    MaterialModule,
    CommonModule,
    WrapperModule,
    ExtractorActivityModule,
    ExtractorVentilationModule
  ],
})
export class DashboardModule { }
