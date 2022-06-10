import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { BackupOptionsPage } from './backup-options.page';
import { BackupOptionsPageModule } from './backup-options.routing';
import { ComponentsModule } from 'src/app/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MaterialModule } from 'src/app/libs/material.module';

@NgModule({
  declarations: [BackupOptionsPage],
  imports: [BackupOptionsPageModule, RouterModule, ComponentsModule, FormsModule, ReactiveFormsModule, CommonModule, MaterialModule],
})
export class BackupOptionsModule {}
