import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { YamlToolsPage } from './yaml-tools.page';
import { FormsModule } from "@angular/forms";

const routes: Routes = [
	{
		path: '',
		component: YamlToolsPage
	}
];

@NgModule({
	imports: [RouterModule.forChild(routes), FormsModule],
	exports: [RouterModule]
})
export class YamlToolsPageModule { }
