import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { LoginPage } from './login.page'
import { LoginPageModule } from './login.routing'
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module'
import { CommonModule } from '@angular/common'
import { PopupModule } from 'src/app/components/popup/popup.module'

@NgModule({
  declarations: [LoginPage],
  imports: [
    LoginPageModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    WrapperNoConnectedModule,
    PopupModule,
  ],
})
export class LoginModule {}
