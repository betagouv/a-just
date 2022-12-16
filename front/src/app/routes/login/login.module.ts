import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { LoginPage } from './login.page';
import { LoginPageModule } from './login.routing';

@NgModule({
	declarations: [ LoginPage ],
	imports: [ LoginPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class LoginModule {}
