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
import { SelectModule } from 'src/app/components/select/select.module'
import { BackButtonModule } from 'src/app/components/back-button/back-button.module'
import { DtesChartModule } from './charts/dtes-chart/dtes-chart.module'
import { InOutChartModule } from './charts/in-out-chart/in-out.module'
import { EtpChartModule } from './charts/etp-chart/etp-chart.module'
import { EditableSituationModule } from './editable-situation/editable-situation.module'
import { DialWidgetModule } from './widgets/dial-widget/dial-widget.module'
import { CoveragePreviewModule } from './widgets/coverage-preview/coverage-preview.module'
import { LoadersWidgetModule } from './widgets/loaders-widget/loaders-widget.module'
import { IntroJSModule } from 'src/app/components/intro-js/intro-js.module'
import { WhiteSimulatorModule } from './white-simulator/white-simulator.module'
import { HeaderSelectorsModule } from './header-selectors/header-selectors.module'
import { PeriodSelectorModule } from './period-selector/period-selector.module'
import { SituationDisplayerModule } from './situation-displayer/situation-displayer.module'

@NgModule({
  declarations: [SimulatorPage],
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
    BackButtonModule,
    DtesChartModule,
    InOutChartModule,
    EtpChartModule,
    EditableSituationModule,
    CoveragePreviewModule,
    LoadersWidgetModule,
    DialWidgetModule,
    IntroJSModule,
    HeaderSelectorsModule,
    PeriodSelectorModule,
    SituationDisplayerModule,
  ],
})
export class SimulatorModule {}
