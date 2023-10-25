import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ImportsPage } from './imports.page';
import { SelectComponent } from 'src/app/components/select/select.component';

const routes: Routes = [
	{
		path: '',
		component: ImportsPage
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class ImportsPageModule { }
