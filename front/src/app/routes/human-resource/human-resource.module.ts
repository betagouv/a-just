import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HumanResourcePage } from './human-resource.page';
import { HumanResourcePageModule } from './human-resource.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [HumanResourcePage],
  imports: [HumanResourcePageModule, RouterModule, ComponentsModule, FormsModule, ReactiveFormsModule, CommonModule],
})
export class HumanResourceModule {}
