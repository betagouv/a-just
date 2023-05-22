import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SiteMapPage } from './sitemap.page';

const routes: Routes = [
	{
		path: '',
		component: SiteMapPage
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class SiteMapPageModule {}
