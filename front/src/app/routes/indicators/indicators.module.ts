import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IndicatorsPage } from './indicators.page';
import { IndicatorsPageModule } from './indicators.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [IndicatorsPage],
  imports: [IndicatorsPageModule, RouterModule, ComponentsModule],
})
export class IndicatorsModule {}
