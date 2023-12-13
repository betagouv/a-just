import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ForgotPassword } from './forgot-password.page';
import { ForgotPasswordPageModule } from './forgot-password.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';
import { PopupModule } from 'src/app/components/popup/popup.module';
import { CommonModule } from '@angular/common';

@NgModule({
	declarations: [ForgotPassword],
	imports: [ForgotPasswordPageModule, FormsModule, ReactiveFormsModule, RouterModule, WrapperNoConnectedModule, PopupModule, CommonModule]
})
export class ForgotPasswordModule { }
