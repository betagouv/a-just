import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WrapperComponent } from './wrapper/wrapper.component';
import { SpeedometerComponent } from './speedometer/speedometer.component';
import { PopupComponent } from './popup/popup.component';

const list = [WrapperComponent, SpeedometerComponent, PopupComponent];

@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule],
  exports: list,
})
export class ComponentsModule {}
