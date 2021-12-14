import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CalculatorPage } from './calculator.page';
import { CalculatorPageModule } from './calculator.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/libs/material.module';

@NgModule({
  declarations: [CalculatorPage],
  imports: [CalculatorPageModule, RouterModule, ComponentsModule, CommonModule, ReactiveFormsModule, FormsModule, MaterialModule],
})
export class CalculatorModule {}
