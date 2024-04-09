import { NgModule } from '@angular/core'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { RouterModule } from '@angular/router'
import { CGUPage } from './cgu.page'
import { CGUPageModule } from './cgu.routing'
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'

@NgModule({
  declarations: [CGUPage],
  imports: [
    CGUPageModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    WrapperNoConnectedModule,
    BackButtonModule,
  ],
})
export class CGUModule {}
