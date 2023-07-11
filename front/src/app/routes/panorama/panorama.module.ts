import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { PanoramaPage } from './panorama.page'
import { PanoramaPageModule } from './panorama.routing'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { PanoramaAlertComponent } from './panorama-alert/panorama-alert.component'
import { ActivitiesLastModificationsComponent } from './activities-last-modifications/activities-last-modifications.component'
import { ActivitiesLastDisponibilitiesComponent } from './activities-last-disponibilities/activities-last-disponibilities.component'
import { ActivitiesToCompleteComponent } from './activities-to-complete/activities-to-complete.component'
import { WorkforceCompositionComponent } from './workforce-composition/workforce-composition.component'
import { WorkforceChangeComponent } from './workforce-change/workforce-change.component'
import { RecordsUpdateComponent } from './records-updates/records-update.component'
import {NgxPaginationModule} from 'ngx-pagination';

@NgModule({
  declarations: [
    PanoramaPage,
    PanoramaAlertComponent,
    WorkforceCompositionComponent,
    WorkforceChangeComponent,
    RecordsUpdateComponent,
    ActivitiesLastModificationsComponent,
    ActivitiesLastDisponibilitiesComponent,
    ActivitiesToCompleteComponent,
  ],
  imports: [
    PanoramaPageModule,
    RouterModule,
    ComponentsModule,
    CommonModule,
    MaterialModule,
    NgxPaginationModule,
  ],
})
export class PanoramaModule {}
