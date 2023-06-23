import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ChangePassword } from './change-password.page';
import { ChangePasswordPageModule } from './change-password.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';

@NgModule({
	declarations: [ ChangePassword ],
	imports: [ ChangePasswordPageModule, FormsModule, ReactiveFormsModule, RouterModule, WrapperNoConnectedModule ]
})
export class ChangePasswordModule {}
