import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CGUPage } from './cgu.page';

const routes: Routes = [
	{
		path: ':backPath',
		component: CGUPage
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class CGUPageModule { }
