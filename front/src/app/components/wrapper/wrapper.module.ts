import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterModule } from '@angular/router'
import { WrapperComponent } from './wrapper.component'
import { NewsComponent } from './news/news.component'
import { MaterialModule } from 'src/app/libs/material.module'
import { PopupModule } from '../popup/popup.module'
import { PipesModule } from 'src/app/pipes/pipes.module'
import { TextEditorModule } from '../text-editor/text-editor.module'
import { HelpButtonModule } from '../help-button/help-button.module'
import { DateSelectModule } from 'src/app/components/date-select/date-select.module'
import { BackButtonModule } from '../back-button/back-button.module'

/**
 * Liste des composants à importer
 */
const list = [WrapperComponent]

/**
 * Module d'import de composant
 */
@NgModule({
  declarations: [...list, NewsComponent],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    PopupModule,
    PipesModule,
    TextEditorModule,
    HelpButtonModule,
    DateSelectModule,
    BackButtonModule,
  ],
  exports: list,
})
export class WrapperModule { }
