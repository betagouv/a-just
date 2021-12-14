import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HomePage } from './home.page';
import { HomePageModule } from './home.routing';

@NgModule({
	declarations: [ HomePage ],
	imports: [ HomePageModule, FormsModule, ReactiveFormsModule, RouterModule ]
})
export class HomeModule {}
