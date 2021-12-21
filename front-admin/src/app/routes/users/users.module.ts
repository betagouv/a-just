import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { UsersPage } from './users.page';
import { UsersPageModule } from './users.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/libs/material.module';

@NgModule({
  declarations: [UsersPage],
  imports: [UsersPageModule, RouterModule, ComponentsModule, FormsModule, ReactiveFormsModule, CommonModule, MaterialModule],
})
export class UsersModule {}
