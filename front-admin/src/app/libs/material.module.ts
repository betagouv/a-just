import { NgModule } from '@angular/core'
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input'
import {
  MatLegacyFormFieldModule as MatFormFieldModule,
  MAT_LEGACY_FORM_FIELD_DEFAULT_OPTIONS as MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/legacy-form-field'
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button'
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card'
import {
  MatLegacySnackBarModule as MatSnackBarModule,
  MAT_LEGACY_SNACK_BAR_DEFAULT_OPTIONS as MAT_SNACK_BAR_DEFAULT_OPTIONS,
} from '@angular/material/legacy-snack-bar'
import { MatLegacyTableModule as MatTableModule } from '@angular/material/legacy-table'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog'
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select'
import { MatSortModule } from '@angular/material/sort'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatLegacyProgressSpinnerModule as MatProgressSpinnerModule } from '@angular/material/legacy-progress-spinner'
import { DragDropModule } from '@angular/cdk/drag-drop'
import {
  MatLegacyTooltipDefaultOptions as MatTooltipDefaultOptions,
  MatLegacyTooltipModule as MatTooltipModule,
  MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS as MAT_TOOLTIP_DEFAULT_OPTIONS,
} from '@angular/material/legacy-tooltip'
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox'
import {
  MatNativeDateModule,
  DateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core'
import {
  MomentDateAdapter,
  MAT_MOMENT_DATE_ADAPTER_OPTIONS,
} from '@angular/material-moment-adapter'
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar'

/**
 * Paramétrage du tooltips par défaut de matérial
 */
export const myCustomTooltipDefaults: MatTooltipDefaultOptions = {
  showDelay: 1000,
  hideDelay: 1000,
  touchendHideDelay: 1000,
}

/**
 * Paramétrage du format de la date du composant date de matérial
 */
export const MY_FORMATS = {
  parse: {
    dateInput: 'DD/MM/YYYY',
  },
  display: {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
}

/**
 * Module avec les élements materials qui nous intéresses
 */
@NgModule({
  exports: [
    MatButtonToggleModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    DragDropModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
    MatProgressBarModule,
  ],
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'fill' },
    },
    { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 2500 } },
    { provide: MAT_DATE_LOCALE, useValue: 'fr-FR' },
    { provide: MAT_TOOLTIP_DEFAULT_OPTIONS, useValue: myCustomTooltipDefaults },
    {
      provide: DateAdapter,
      useClass: MomentDateAdapter,
      deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS],
    },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
  ],
})
export class MaterialModule {}
