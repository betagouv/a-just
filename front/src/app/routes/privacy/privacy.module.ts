import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { PrivacyPage } from './privacy.page';
import { PrivacyPageModule } from './privacy.routing';

@NgModule({
	declarations: [ PrivacyPage ],
	imports: [ PrivacyPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class PrivacyModule {}
