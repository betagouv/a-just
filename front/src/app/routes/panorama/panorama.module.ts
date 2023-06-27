import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PanoramaPage } from './panorama.page'
import { PanoramaPageModule } from './panorama.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { PanoramaAlertComponent } from './panorama-alert/panorama-alert.component'

@NgModule({
  declarations: [PanoramaPage,PanoramaAlertComponent],
  imports: [
    PanoramaPageModule,
    RouterModule,
    ComponentsModule,
    CommonModule,
    MaterialModule,
  ],
})
export class PanoramaModule {}
