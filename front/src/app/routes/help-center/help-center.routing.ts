import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HelpCenterPage } from './help-center.page';

const routes: Routes = [
	{
		path: '',
		component: HelpCenterPage
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class HelpCenterPageModule { }
