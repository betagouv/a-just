import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LegaleNoticePage } from './legale-notice.page';

const routes: Routes = [
	{
		path: '',
		component: LegaleNoticePage
	}
];

@NgModule({
	imports: [ RouterModule.forChild(routes) ],
	exports: [ RouterModule ]
})
export class LegaleNoticePageModule {}
