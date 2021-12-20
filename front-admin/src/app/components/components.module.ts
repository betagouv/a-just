import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WrapperComponent } from './wrapper/wrapper.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../libs/material.module';
import { PopupComponent } from './popup/popup.component';

const list = [
  WrapperComponent,
  PopupComponent,
];

@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MaterialModule],
  exports: list,
})
export class ComponentsModule {}
