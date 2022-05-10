import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChangePassword } from './change-password.page';

const routes: Routes = [
	{
		path: '',
		component: ChangePassword
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class ChangePasswordPageModule {}
