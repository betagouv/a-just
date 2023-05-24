import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PrivacyPage } from './privacy.page';
import { PrivacyPageModule } from './privacy.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';

@NgModule({
	declarations: [ PrivacyPage ],
	imports: [ PrivacyPageModule, FormsModule, ReactiveFormsModule, RouterModule, WrapperNoConnectedModule ]
})
export class PrivacyModule {}
