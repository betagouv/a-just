import { Component, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { AngularEditorConfig } from '@kolkov/angular-editor';
import { REMIXICONLIST } from 'src/app/constants/icons';
import { NewsInterface } from 'src/app/interfaces/news';
import { MainClass } from 'src/app/libs/main-class';
import { NewsService } from 'src/app/services/news/news.service';

@Component({
  templateUrl: './news.page.html',
  styleUrls: ['./news.page.scss'],
})
export class NewsPage extends MainClass implements OnInit {
  REMIXICONLIST = REMIXICONLIST;
  displayedColumns: string[] = ['html', 'dateStart', 'dateStop', 'enabled', 'actions'];
  dataSource = new MatTableDataSource();
  newsToEdit: NewsInterface | null = null;
  popupAction = [
    { id: 'save', content: 'Modifier', fill: true },
    { id: 'close', content: 'Fermer' },
  ];
  htmlEditorConfig: AngularEditorConfig = {
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
  };

  constructor(private newsService: NewsService) {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.newsService.getAll().then((datas) => {
      this.dataSource.data = datas;
    });
  }

  onEdit(b: NewsInterface) {
    this.newsToEdit = b;
  }

  onRemove(b: NewsInterface) {
    if(confirm('Supprimer cette notification ?')) {
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
