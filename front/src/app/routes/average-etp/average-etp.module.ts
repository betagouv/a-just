import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AverageEtpPage } from './average-etp.page';
import { AverageEtpPageModule } from './average-etp.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [AverageEtpPage],
  imports: [AverageEtpPageModule, CommonModule, RouterModule, ComponentsModule],
})
export class AverageEtpModule {}
