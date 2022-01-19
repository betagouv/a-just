import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WorkforcePage } from './workforce.page';
import { WorkforcePageModule } from './workforce.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';
import { ProgressionBarComponent } from './progression-bar/progression-bar.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/libs/material.module';
import { EtpPreviewComponent } from './etp-preview/etp-preview.component';

@NgModule({
	declarations: [ WorkforcePage, ProgressionBarComponent, EtpPreviewComponent ],
	imports: [ WorkforcePageModule, RouterModule, ComponentsModule, CommonModule, FormsModule, ReactiveFormsModule, MaterialModule ]
})
export class WorkforceModule {}
