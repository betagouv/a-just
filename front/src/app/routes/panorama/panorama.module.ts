import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PanoramaPage } from './panorama.page'
import { PanoramaPageModule } from './panorama.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'

@NgModule({
  declarations: [PanoramaPage],
  imports: [
    PanoramaPageModule,
    RouterModule,
    ComponentsModule,
    CommonModule,
    MaterialModule,
  ],
})
export class PanoramaModule {}
