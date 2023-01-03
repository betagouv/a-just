import { NgModule } from '@angular/core'
import {
  MAT_LEGACY_SNACK_BAR_DEFAULT_OPTIONS as MAT_SNACK_BAR_DEFAULT_OPTIONS,
} from '@angular/material/legacy-snack-bar'
import { MatIconModule } from '@angular/material/icon'
import { MatSortModule } from '@angular/material/sort'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { DragDropModule } from '@angular/cdk/drag-drop'
import {
  MatLegacyTooltipDefaultOptions as MatTooltipDefaultOptions,
  MAT_LEGACY_TOOLTIP_DEFAULT_OPTIONS as MAT_TOOLTIP_DEFAULT_OPTIONS,
} from '@angular/material/legacy-tooltip'
import { MatButtonToggleModule } from '@angular/material/button-toggle'
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
import { MAT_COLOR_FORMATS, NgxMatColorPickerModule, NGX_MAT_COLOR_FORMATS } from '@angular-material-components/color-picker';
import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field'
import { MatInputModule } from '@angular/material/input'
import { MatButtonModule } from '@angular/material/button'
import { MatSnackBarModule } from '@angular/material/snack-bar'
import { MatTableModule } from '@angular/material/table'
import { MatDialogModule } from '@angular/material/dialog'
import { MatSelectModule } from '@angular/material/select'
import { MatTooltipModule } from '@angular/material/tooltip'


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
    MatSnackBarModule,
    MatTableModule,
    MatIconModule,
    MatDialogModule,
    MatSelectModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
    DragDropModule,
    MatTooltipModule,
    NgxMatColorPickerModule,
  ],
  providers: [
    { provide: MAT_COLOR_FORMATS, useValue: NGX_MAT_COLOR_FORMATS },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { floatLabel: 'always' },
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
