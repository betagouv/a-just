import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ContactPage } from './contact.page';
import { ContactPageModule } from './contact.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';

@NgModule({
	declarations: [ ContactPage ],
	imports: [ ContactPageModule, RouterModule, WrapperNoConnectedModule ]
})
export class ContactModule {}
