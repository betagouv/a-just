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

@NgModule({
  declarations: [CalculatorPage, ReferentielCalculatorComponent],
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
  ],
})
export class CalculatorModule {}
