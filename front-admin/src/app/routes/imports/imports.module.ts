import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { ImportsPage } from './imports.page';
import { ImportsPageModule } from './imports.routing';

@NgModule({
	declarations: [ ImportsPage ],
	imports: [ ImportsPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class ImportsModule {}
