import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { WorkforcePage } from './workforce.page';
import { WorkforcePageModule } from './workforce.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
	declarations: [ WorkforcePage ],
	imports: [ WorkforcePageModule, RouterModule, ComponentsModule ]
})
export class WorkforceModule {}
