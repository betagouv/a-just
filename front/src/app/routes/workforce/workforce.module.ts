import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WorkforcePage } from './workforce.page';
import { WorkforcePageModule } from './workforce.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';
import { ProgressionBarComponent } from './progression-bar/progression-bar.component';

@NgModule({
	declarations: [ WorkforcePage, ProgressionBarComponent ],
	imports: [ WorkforcePageModule, RouterModule, ComponentsModule, CommonModule ]
})
export class WorkforceModule {}
