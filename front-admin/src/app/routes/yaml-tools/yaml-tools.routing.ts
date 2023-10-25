import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { YamlToolsPage } from './yaml-tools.page';

const routes: Routes = [
	{
		path: '',
		component: YamlToolsPage
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes)],
	exports: [RouterModule]
})
export class YamlToolsPageModule { }
