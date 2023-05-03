import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { LegaleNoticePage } from './legale-notice.page';
import { LegaleNoticePageModule } from './legale-notice.routing';

@NgModule({
	declarations: [ LegaleNoticePage ],
	imports: [ LegaleNoticePageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class LegaleNoticeModule {}
