import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ParametersPage } from './parameters.page';
import { ParametersPageModule } from './parameters.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [ParametersPage],
  imports: [ParametersPageModule, RouterModule, ComponentsModule],
})
export class ParametersModule {}
