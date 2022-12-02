import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { ChangePassword } from './change-password.page';
import { ChangePasswordPageModule } from './change-password.routing';

@NgModule({
	declarations: [ ChangePassword ],
	imports: [ ChangePasswordPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class ChangePasswordModule {}
