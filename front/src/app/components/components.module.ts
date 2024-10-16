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
import { LoadersWidgetComponent } from '../routes/simulator/widgets/loaders-widget/loaders-widget.component'
import { FiguresWidgetComponent } from './figures-widget/figures-widget.component'
import { DialWidgetComponent } from '../routes/simulator/widgets/dial-widget/dial-widget.component'
import { CoveragePreviewComponent } from '../routes/simulator/widgets/coverage-preview/coverage-preview.component'
import { NgSelectModule } from '@ng-select/ng-select'
import { RadioButtonComponent } from './radio-button/radio-button.component'
import { EditableSituationComponent } from '../routes/simulator/editable-situation/editable-situation.component'
import { CalculatriceComponent } from './calculatrice/calculatrice.component';
import { PopupModule } from './popup/popup.module'
import { PanelActivitiesModule } from './panel-activities/panel-activities.module'
import { SelectModule } from './select/select.module'
import { DateSelectModule } from './date-select/date-select.module';
import { DocCardComponent } from './doc-card/doc-card.component';

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
  FiguresWidgetComponent,
  RadioButtonComponent,
  CalculatriceComponent,
  DocCardComponent
]

/**
 * Module d'import de composant
 */
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
    PopupModule,
    PanelActivitiesModule,
    SelectModule,
    DateSelectModule
  ],
  exports: list,
})
export class ComponentsModule { }
