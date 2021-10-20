import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WrapperComponent } from './wrapper/wrapper.component';
import { SpeedometerComponent } from './speedometer/speedometer.component';

const list = [WrapperComponent, SpeedometerComponent];

@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule],
  exports: list,
})
export class ComponentsModule {}
