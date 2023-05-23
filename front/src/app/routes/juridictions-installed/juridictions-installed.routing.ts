import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JuridictionsInstalledPage } from './juridictions-installed.page';

const routes: Routes = [
	{
		path: '',
		component: JuridictionsInstalledPage
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class JuridictionsInstalledPageModule {}
