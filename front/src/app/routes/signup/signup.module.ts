import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SignupPage } from './signup.page';
import { SignupPageModule } from './signup.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';
import { CommonModule } from '@angular/common';

@NgModule({
	declarations: [SignupPage],
	imports: [SignupPageModule, FormsModule, ReactiveFormsModule, RouterModule, WrapperNoConnectedModule, CommonModule]
})
export class SignupModule { }
