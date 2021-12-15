import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SignupPage } from './signup.page';
import { SignupPageModule } from './signup.routing';

@NgModule({
	declarations: [ SignupPage ],
	imports: [ SignupPageModule, FormsModule, ReactiveFormsModule, RouterModule ]
})
export class SignupModule {}
