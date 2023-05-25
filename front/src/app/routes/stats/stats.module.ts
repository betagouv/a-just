import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { StatsPage } from './stats.page';
import { StatsPageModule } from './stats.routing';
import { WrapperNoConnectedModule } from 'src/app/components/wrapper-no-connected/wrapper-no-connected.module';

@NgModule({
	declarations: [ StatsPage ],
	imports: [ StatsPageModule, RouterModule, WrapperNoConnectedModule ]
})
export class StatsModule {}
