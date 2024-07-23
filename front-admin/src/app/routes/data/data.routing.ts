import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DataPage } from './data.page';

const routes: Routes = [
	{
		path: '',
		component: DataPage
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class DataPageModule {}
