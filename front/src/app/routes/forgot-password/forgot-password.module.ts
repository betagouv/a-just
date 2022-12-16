import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { ForgotPassword } from './forgot-password.page';
import { ForgotPasswordPageModule } from './forgot-password.routing';

@NgModule({
	declarations: [ ForgotPassword ],
	imports: [ ForgotPasswordPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class ForgotPasswordModule {}
