import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { DataPage } from './data.page';
import { DataPageModule } from './data.routing';

@NgModule({
	declarations: [ DataPage ],
	imports: [ DataPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule, CommonModule]
})
export class DataModule {}
