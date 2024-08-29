import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { CalculatorPage } from './calculator.page'
import { CalculatorPageModule } from './calculator.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MaterialModule } from 'src/app/libs/material.module'
import { ReferentielCalculatorComponent } from './referentiel-calculator/referentiel-calculator.component'
import { SpeedometerModule } from 'src/app/components/speedometer/speedometer.module'
import { SelectModule } from 'src/app/components/select/select.module'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { IntroJSModule } from 'src/app/components/intro-js/intro-js.module'
import { ViewAnalyticsComponent } from './view-analytics/view-analytics.component'
import { GraphsVerticalsLinesComponent } from './view-analytics/graphs-verticals-lines/graphs-verticals-lines.component'
import { GraphsNumbersComponent } from './view-analytics/graphs-numbers/graphs-numbers.component'
import { GraphsProgressComponent } from './view-analytics/graphs-progress/graphs-progress.component'
import { PopupModule } from 'src/app/components/popup/popup.module'
import { TemplateAnalyticsComponent } from './template-analytics/template-analytics.component'
import { PipesModule } from 'src/app/pipes/pipes.module'

@NgModule({
  declarations: [CalculatorPage, ReferentielCalculatorComponent, ViewAnalyticsComponent, GraphsVerticalsLinesComponent, GraphsNumbersComponent, GraphsProgressComponent, TemplateAnalyticsComponent],
  imports: [
    CalculatorPageModule,
    RouterModule,
    ComponentsModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MaterialModule,
    SpeedometerModule,
    SelectModule,
    DateSelectModule,
    WrapperModule,
    IntroJSModule,
    PopupModule,
    PipesModule
  ],
})
export class CalculatorModule { }
