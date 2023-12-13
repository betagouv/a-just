import { NgModule } from '@angular/core'
import { SimulatorPageModule } from './simulator.routing'
import { SimulatorPage } from './simulator.page'
import { RouterModule } from '@angular/router'
import { ComponentsModule } from 'src/app/components/components.module'
import { MaterialModule } from 'src/app/libs/material.module'
import { CommonModule } from '@angular/common'
import { MatTooltipModule } from '@angular/material/tooltip'
import { PopupModule } from 'src/app/components/popup/popup.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { SelectModule } from 'src/app/components/select/select.module';
import { HeaderSelectorsComponent } from './header-selectors/header-selectors.component';
import { PeriodSelectorComponent } from './period-selector/period-selector.component';
import { SituationDisplayerComponent } from './situation-displayer/situation-displayer.component';

@NgModule({
  declarations: [SimulatorPage, HeaderSelectorsComponent, PeriodSelectorComponent, SituationDisplayerComponent],
  imports: [
    SimulatorPageModule,
    RouterModule,
    ComponentsModule,
    MaterialModule,
    CommonModule,
    MatTooltipModule,
    PopupModule,
    WrapperModule,
    SelectModule,
  ],
})
export class SimulatorModule { }
