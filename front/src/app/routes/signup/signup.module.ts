import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { SignupPage } from './signup.page';
import { SignupPageModule } from './signup.routing';

@NgModule({
	declarations: [ SignupPage ],
	imports: [ SignupPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class SignupModule {}
