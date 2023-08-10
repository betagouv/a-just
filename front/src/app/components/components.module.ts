import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { ListSelectionComponent } from './list-selection/list-selection.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MaterialModule } from '../libs/material.module'
import { OptionsBackupPanelComponent } from './options-backup-panel/options-backup-panel.component'
import { DateSelectBlueComponent } from './date-select-blue/date-select-blue.component'
import { TooltipsComponent } from './tooltips/tooltips.component'
import { PipesModule } from '../pipes/pipes.module'
import { TimeSelectorComponent } from './time-selector/time-selector.component'
import { InputPercentageComponent } from './input-percent/input-percentage.component'
import { LoadersWidgetComponent } from './loaders-widget/loaders-widget.component'
import { FiguresWidgetComponent } from './figures-widget/figures-widget.component'
import { DialWidgetComponent } from './dial-widget/dial-widget.component'
import { CoveragePreviewComponent } from './coverage-preview/coverage-preview.component'
import { NgSelectModule } from '@ng-select/ng-select'
import { DtesChartComponent } from './dtes-chart/dtes-chart.component'
import { RadioButtonComponent } from './radio-button/radio-button.component'
import { LegendLabelComponent } from './legend-label/legend-label.component'
import { InOutChartComponent } from './in-out-chart/in-out-chart.component'
import { EtpChartComponent } from './etp-chart/etp-chart.component'
import { ExtractorActivityComponent } from './extractor-activity/extractor-activity.component';
import { ExtractorVentilationComponent } from './extractor-ventilation/extractor-ventilation.component'
import { EditableSituationComponent } from './editable-situation/editable-situation.component'
import { CalculatriceComponent } from './calculatrice/calculatrice.component';
import { PopupModule } from './popup/popup.module'
import { PanelActivitiesModule } from './panel-activities/panel-activities.module'
import { SelectModule } from './select/select.module'
import { DateSelectModule } from './date-select/date-select.module'

/**
 * Liste des composants à importer
 */
const list = [
  ListSelectionComponent,
  OptionsBackupPanelComponent,
  DateSelectBlueComponent,
  TooltipsComponent,
  TimeSelectorComponent,
  InputPercentageComponent,
  LoadersWidgetComponent,
  FiguresWidgetComponent,
  DialWidgetComponent,
  CoveragePreviewComponent,
  DtesChartComponent,
  RadioButtonComponent,
  LegendLabelComponent,
  InOutChartComponent,
  EtpChartComponent,
  ExtractorActivityComponent,
  ExtractorVentilationComponent,
  EditableSituationComponent,
  CalculatriceComponent,
]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list, EditableSituationComponent],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PipesModule,
    NgSelectModule,
    PopupModule,
    PanelActivitiesModule,
    SelectModule,
    DateSelectModule
  ],
  exports: list,
})
export class ComponentsModule {}
