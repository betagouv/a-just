import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForgotPassword } from './forgot-password.page';

const routes: Routes = [
	{
		path: '',
		component: ForgotPassword
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class ForgotPasswordPageModule {}
