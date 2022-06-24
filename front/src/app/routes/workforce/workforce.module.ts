import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WorkforcePage } from './workforce.page';
import { WorkforcePageModule } from './workforce.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/libs/material.module';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';

@NgModule({
	declarations: [ WorkforcePage, FilterPanelComponent ],
	imports: [ WorkforcePageModule, RouterModule, ComponentsModule, CommonModule, FormsModule, ReactiveFormsModule, MaterialModule ]
})
export class WorkforceModule {}
