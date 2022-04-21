import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChangePassword } from './change-password.page';
import { ChangePasswordPageModule } from './change-password.routing';

@NgModule({
	declarations: [ ChangePassword ],
	imports: [ ChangePasswordPageModule, FormsModule, ReactiveFormsModule, RouterModule ]
})
export class ChangePasswordModule {}
