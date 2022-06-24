import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { WrapperComponent } from './wrapper/wrapper.component'
import { SpeedometerComponent } from './speedometer/speedometer.component'
import { PopupComponent } from './popup/popup.component'
import { ListSelectionComponent } from './list-selection/list-selection.component'
import { RhBackupPanelComponent } from './rh-backup-panel/rh-backup-panel.component'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { MaterialModule } from '../libs/material.module'
import { OptionsBackupPanelComponent } from './options-backup-panel/options-backup-panel.component'
import { ReferentielCalculatorComponent } from './referentiel-calculator/referentiel-calculator.component'
import { SelectCheckAllComponent } from './select-check-all/select-check-all.component'
import { SelectComponent } from './select/select.component'
import { DateSelectComponent } from './date-select/date-select.component'
import { InputButtonComponent } from './input-button/input-button.component'
import { EtpPreviewComponent } from './etp-preview/etp-preview.component'
import { ProgressionBarComponent } from './progression-bar/progression-bar.component'
import { PanelActivitiesComponent } from './panel-activities/panel-activities.component'
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

const list = [
  WrapperComponent,
  SpeedometerComponent,
  PopupComponent,
  ListSelectionComponent,
  RhBackupPanelComponent,
  OptionsBackupPanelComponent,
  ReferentielCalculatorComponent,
  SelectCheckAllComponent,
  SelectComponent,
  DateSelectComponent,
  InputButtonComponent,
  EtpPreviewComponent,
  ProgressionBarComponent,
  PanelActivitiesComponent,
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
]

@NgModule({
  declarations: [...list],
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    PipesModule,
    NgSelectModule,
  ],
  exports: list,
})
export class ComponentsModule {}
