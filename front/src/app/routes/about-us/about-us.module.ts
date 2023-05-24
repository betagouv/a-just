import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AboutUsPage } from './about-us.page';
import { AboutUsPageModule } from './about-us.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';

@NgModule({
	declarations: [ AboutUsPage ],
	imports: [ AboutUsPageModule, RouterModule, WrapperNoConnectedModule ]
})
export class AboutUsModule {}
