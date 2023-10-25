import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { DataAnalysePage } from './data-analyse.page';
import { DataAnalysePageModule } from './data-analyse.routing';

@NgModule({
	declarations: [ DataAnalysePage ],
	imports: [ DataAnalysePageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule, CommonModule]
})
export class DataAnalyseModule {}
