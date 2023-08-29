import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DataAnalysePage } from './data-analyse.page';

const routes: Routes = [
	{
		path: '',
		component: DataAnalysePage
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class DataAnalysePageModule {}
