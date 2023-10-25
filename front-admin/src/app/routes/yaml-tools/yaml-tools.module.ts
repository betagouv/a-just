import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { YamlToolsPage } from './yaml-tools.page';
import { YamlToolsPageModule } from './yaml-tools.routing';

@NgModule({
	declarations: [YamlToolsPage],
	imports: [YamlToolsPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule, CommonModule]
})
export class YamlToolsModule { }
