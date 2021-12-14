import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { DashboardPage } from './dashboard.page';
import { DashboardPageModule } from './dashboard.routing';
import { ComponentsModule } from 'src/app/components/components.module';

@NgModule({
	declarations: [ DashboardPage ],
	imports: [ DashboardPageModule, RouterModule, ComponentsModule ]
})
export class DashboardModule {}
