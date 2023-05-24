import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AccessibilitiesPage } from './accessibilities.page';
import { AccessibilitiesPageModule } from './accessibilities.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';

@NgModule({
	declarations: [ AccessibilitiesPage ],
	imports: [ AccessibilitiesPageModule, RouterModule, WrapperNoConnectedModule ]
})
export class AccessibilitiesModule {}
