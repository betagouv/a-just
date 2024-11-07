import { ColorPickerModule } from 'ngx-color-picker';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MainClass } from '../../libs/main-class';
import { REMIXICONLIST } from '../../constants/icons';
import { NewsInterface } from '../../interfaces/news';
import { NewsService } from '../../services/news/news.service';
import { hexToRgb } from '../../utils/color';
import { CommonModule } from '@angular/common';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { PopupComponent } from '../../components/popup/popup.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Editor, NgxEditorModule } from 'ngx-editor';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    WrapperComponent,
    PopupComponent,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatDatepickerModule,
    ColorPickerModule,
    NgxEditorModule,
  ],
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage extends MainClass implements OnInit, OnDestroy {
  newsService = inject(NewsService);
  REMIXICONLIST = REMIXICONLIST;
  displayedColumns: string[] = [
    'html',
    'dateStart',
    'dateStop',
    'enabled',
    'actions',
  ];
  dataSource = new MatTableDataSource();
  newsToEdit: NewsInterface | null = null;
  popupAction = [
    { id: 'save', content: 'Modifier', fill: true },
    { id: 'close', content: 'Fermer' },
  ];
  editor: Editor | undefined;
  /*htmlEditorConfig: AngularEditorConfig = {
    editable: true,
    height: 'auto',
    minHeight: '100',
    maxHeight: 'auto',
    width: 'auto',
    enableToolbar: true,
    showToolbar: true,
    sanitize: true,
    toolbarPosition: 'top',
    toolbarHiddenButtons: [
      [
        'strikeThrough',
        'subscript',
        'superscript',
        'justifyLeft',
        'justifyCenter',
        'justifyRight',
        'justifyFull',
        'indent',
        'outdent',
        'insertUnorderedList',
        'insertOrderedList',
        'heading',
        'fontName',
      ],
      [
        'fontSize',
        'textColor',
        'backgroundColor',
        'customClasses',
        'link',
        'unlink',
        'insertImage',
        'insertVideo',
        'insertHorizontalRule',
        'removeFormat',
        'toggleEditorMode',
      ],
    ],
  };*/

  constructor() {
    super();
  }

  ngOnInit() {
    this.editor = new Editor();
    this.onLoad();
  }

  // make sure to destory the editor
  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  onLoad() {
    this.newsService.getAll().then((datas) => {
      this.dataSource.data = datas.map((d: NewsInterface) => {
        const textColorHex =
          d.textColor && typeof d.textColor === 'string'
            ? hexToRgb(d.textColor)
            : null;
        const backgroundColorHex =
          d.backgroundColor && typeof d.backgroundColor === 'string'
            ? hexToRgb(d.backgroundColor)
            : null;
        const actionButtonColorHex =
          d.actionButtonColor && typeof d.actionButtonColor === 'string'
            ? hexToRgb(d.actionButtonColor)
            : null;

        return {
          ...d,
          textColor: textColorHex || '',
          backgroundColor: backgroundColorHex || '',
          actionButtonColor: actionButtonColorHex || '',
        };
      });
    });
  }

  onEdit(b: NewsInterface) {
    this.newsToEdit = b;
  }

  onRemove(b: NewsInterface) {
    if (confirm('Supprimer cette notification ?')) {
      this.newsService.remove(b.id).then(() => {
        this.onLoad();
      });
    }
  }

  onCreate() {
    this.newsToEdit = {
      id: -1,
      html: '',
      enabled: false,
      backgroundColor: '',
      textColor: '',
      actionButtonColor: '',
    };
  }

  onPopupDetailAction(action: any) {
    switch (action.id) {
      case 'save':
        {
          if (this.newsToEdit) {
            if (!this.newsToEdit.html) {
              alert('Vous devez saisir un contenu !');
              return;
            }

            if (!this.newsToEdit.dateStart) {
              alert('Vous devez saisir une date de début de diffusion !');
              return;
            }

            if (!this.newsToEdit.dateStop) {
              alert('Vous devez saisir une date de fin de diffusion !');
              return;
            }

            console.log(this.newsToEdit);

            this.newsService.updateOrCreate(this.newsToEdit).then(() => {
              this.newsToEdit = null;
              this.onLoad();
            });
          }
        }
        break;
      case 'close':
        this.newsToEdit = null;
        break;
    }
  }

  onDateChanged(node: 'dateStart' | 'dateStop', event: any) {
    // @ts-ignore
    this.newsToEdit[node] = undefined;

    if (event && event._i.year) {
      const date = new Date(event._i.year, event._i.month, event._i.date);
      // @ts-ignore
      this.newsToEdit[node] = date;
    }
  }
}
