import { NgModule } from '@angular/core'
import { RouterModule } from '@angular/router'
import { ComponentsModule } from 'src/app/components/components.module'
import { CommonModule } from '@angular/common'
import { MaterialModule } from 'src/app/libs/material.module'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { SelectModule } from 'src/app/components/select/select.module'
import { WrapperModule } from 'src/app/components/wrapper/wrapper.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'
import { WhiteSimulatorPage } from './white-simulator.page'
import { WhiteSimulatorPageModule } from './white-simulator.routing'
import { MatTooltipModule } from '@angular/material/tooltip'
import { PopupModule } from 'src/app/components/popup/popup.module'
import { DtesChartModule } from '../charts/dtes-chart/dtes-chart.module'
import { InOutChartModule } from '../charts/in-out-chart/in-out.module'
import { EtpChartModule } from '../charts/etp-chart/etp-chart.module'
import { EditableSituationModule } from '../editable-situation/editable-situation.module'
import { CoveragePreviewModule } from '../widgets/coverage-preview/coverage-preview.module'
import { LoadersWidgetModule } from '../widgets/loaders-widget/loaders-widget.module'
import { DialWidgetModule } from '../widgets/dial-widget/dial-widget.module'
import { IntroJSModule } from 'src/app/components/intro-js/intro-js.module'
import { HeaderSelectorsComponent } from '../header-selectors/header-selectors.component'
import { PeriodSelectorComponent } from '../period-selector/period-selector.component'
import { SituationDisplayerComponent } from '../situation-displayer/situation-displayer.component'
import { SimulatorModule } from '../simulator.module'
import { HeaderSelectorsModule } from '../header-selectors/header-selectors.module'
import { PeriodSelectorModule } from '../period-selector/period-selector.module'
import { SituationDisplayerModule } from '../situation-displayer/situation-displayer.module'

@NgModule({
  declarations: [WhiteSimulatorPage],
  imports: [
    CommonModule,
    RouterModule,
    ComponentsModule,
    BackButtonModule,
    WrapperModule,
    RouterModule,
    ComponentsModule,
    MaterialModule,
    CommonModule,
    MatTooltipModule,
    PopupModule,
    WrapperModule,
    SelectModule,
    BackButtonModule,
    DtesChartModule,
    InOutChartModule,
    EtpChartModule,
    EditableSituationModule,
    CoveragePreviewModule,
    LoadersWidgetModule,
    DialWidgetModule,
    IntroJSModule,
    SimulatorModule,
    HeaderSelectorsModule,
    PeriodSelectorModule,
    SituationDisplayerModule,
    SelectModule,
  ],
})
export class WhiteSimulatorModule {}
