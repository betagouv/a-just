import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from 'src/app/components/components.module';
import { StatsPage } from './stats.page';
import { StatsPageModule } from './stats.routing';

@NgModule({
	declarations: [ StatsPage ],
	imports: [ StatsPageModule, FormsModule, ReactiveFormsModule, RouterModule, ComponentsModule ]
})
export class StatsModule {}
