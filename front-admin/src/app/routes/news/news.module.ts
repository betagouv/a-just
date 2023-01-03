import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NewsPage } from './news.page';
import { NewsPageModule } from './news.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/libs/material.module';
import { AngularEditorModule } from '@kolkov/angular-editor';

@NgModule({
  declarations: [NewsPage],
  imports: [NewsPageModule, RouterModule, ComponentsModule, FormsModule, ReactiveFormsModule, CommonModule, MaterialModule, AngularEditorModule],
})
export class NewsModule {}
