import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LoginPage } from './login.page';
import { LoginPageModule } from './login.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';

@NgModule({
	declarations: [LoginPage],
	imports: [LoginPageModule, CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule]
})
export class LoginModule { }
