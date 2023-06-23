import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LegaleNoticePage } from './legale-notice.page';
import { LegaleNoticePageModule } from './legale-notice.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';

@NgModule({
	declarations: [ LegaleNoticePage ],
	imports: [ LegaleNoticePageModule, RouterModule, WrapperNoConnectedModule ]
})
export class LegaleNoticeModule {}
