import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CalculatorPage } from './calculator.page';
import { CalculatorPageModule } from './calculator.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/libs/material.module';
import { ReferentielCalculatorComponent } from './referentiel-calculator/referentiel-calculator.component';

@NgModule({
  declarations: [CalculatorPage, ReferentielCalculatorComponent],
  imports: [CalculatorPageModule, RouterModule, ComponentsModule, CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
})
export class CalculatorModule {}
