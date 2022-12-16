import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { AboutUsPage } from './about-us.page';
import { AboutUsPageModule } from './about-us.routing';

@NgModule({
	declarations: [ AboutUsPage ],
	imports: [ AboutUsPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class AboutUsModule {}
