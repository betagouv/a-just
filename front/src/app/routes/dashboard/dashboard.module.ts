import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DashboardBubbleComponent } from './dashboard-bubble/dashboard-bubble.component';
import { DashboardPage } from './dashboard.page';
import { DashboardPageModule } from './dashboard.routing';
import { NgChartsModule } from 'ng2-charts';
import { DashboardLineComponent } from './dashboard-line/dashboard-line.component';

@NgModule({
	declarations: [ DashboardPage, DashboardBubbleComponent, DashboardLineComponent ],
	imports: [ DashboardPageModule, FormsModule, ReactiveFormsModule, RouterModule, NgChartsModule ]
})
export class DashboardModule {}
