import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { AccessibilitiesPage } from './accessibilities.page';
import { AccessibilitiesPageModule } from './accessibilities.routing';

@NgModule({
	declarations: [ AccessibilitiesPage ],
	imports: [ AccessibilitiesPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class AccessibilitiesModule {}
