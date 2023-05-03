import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { ContactPage } from './contact.page';
import { ContactPageModule } from './contact.routing';

@NgModule({
	declarations: [ ContactPage ],
	imports: [ ContactPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class ContactModule {}
