import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StatsPage } from './stats.page';

const routes: Routes = [
	{
		path: '',
		component: StatsPage
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class StatsPageModule {}