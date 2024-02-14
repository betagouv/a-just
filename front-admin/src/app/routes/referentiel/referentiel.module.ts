import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ReferentielPage } from './referentiel.page';
import { ReferentielPageModule } from './referentiel.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [ReferentielPage],
  imports: [ReferentielPageModule, RouterModule, ComponentsModule, FormsModule, ReactiveFormsModule, CommonModule],
})
export class ReferentielModule {}
