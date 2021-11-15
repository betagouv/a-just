import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CalculatorPage } from './calculator.page';
import { CalculatorPageModule } from './calculator.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [CalculatorPage],
  imports: [CalculatorPageModule, RouterModule, ComponentsModule],
})
export class CalculatorModule {}
