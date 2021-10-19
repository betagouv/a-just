import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WrapperComponent } from './wrapper/wrapper.component';

const list = [WrapperComponent];

@NgModule({
  declarations: [...list],
  imports: [CommonModule, RouterModule],
  exports: list,
})
export class ComponentsModule {}
