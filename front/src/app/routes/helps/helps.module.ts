import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HelpsPage } from './helps.page';
import { HelpsPageModule } from './helps.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
  declarations: [HelpsPage],
  imports: [HelpsPageModule, RouterModule, ComponentsModule],
})
export class HelpsModule {}
