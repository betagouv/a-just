import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccessibilitiesPage } from './accessibilities.page';

const routes: Routes = [
	{
		path: '',
		component: AccessibilitiesPage
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class AccessibilitiesPageModule {}
