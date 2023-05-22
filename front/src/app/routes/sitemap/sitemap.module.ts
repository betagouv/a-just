import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { SiteMapPage } from './sitemap.page';
import { SiteMapPageModule } from './sitemap.routing';

@NgModule({
	declarations: [ SiteMapPage ],
	imports: [ SiteMapPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class SiteMapModule {}
