import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SiteMapPage } from './sitemap.page';
import { SiteMapPageModule } from './sitemap.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';

@NgModule({
	declarations: [ SiteMapPage ],
	imports: [ SiteMapPageModule, FormsModule, ReactiveFormsModule, RouterModule, WrapperNoConnectedModule ]
})
export class SiteMapModule {}
