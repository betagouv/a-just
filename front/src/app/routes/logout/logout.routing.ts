import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LogoutPage } from './logout.page';

const routes: Routes = [
	{
		path: '',
		component: LogoutPage
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class LogoutPageModule {}
