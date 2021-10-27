import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IndicatorsPage } from './indicators.page';
import { IndicatorsPageModule } from './indicators.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [IndicatorsPage],
  imports: [IndicatorsPageModule, CommonModule, RouterModule, ComponentsModule],
})
export class IndicatorsModule {}
