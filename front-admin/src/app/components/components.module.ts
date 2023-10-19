import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WrapperComponent } from './wrapper/wrapper.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../libs/material.module';
import { PopupComponent } from './popup/popup.component';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { SelectComponent } from './select/select.component';
import { MatListModule } from '@angular/material/list';

const list = [
  WrapperComponent,
  PopupComponent,
  SelectComponent
];

@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, MaterialModule, MatSelectModule,
    MatOptionModule,
    MatIconModule,
    MatListModule
  ],
  exports: list,
})
export class ComponentsModule { }
