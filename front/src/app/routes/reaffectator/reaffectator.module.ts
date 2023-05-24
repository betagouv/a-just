import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReaffectatorPage } from './reaffectator.page';
import { ReaffectatorPageModule } from './reaffectator.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from 'src/app/libs/material.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
	declarations: [ ReaffectatorPage ],
	imports: [ ReaffectatorPageModule, RouterModule, ComponentsModule, CommonModule, FormsModule, ReactiveFormsModule, MaterialModule, PipesModule ]
})
export class ReaffectatorModule {}
