import {
  AfterViewInit,
  Component,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MainClass } from '../../libs/main-class';
import { JuridictionInterface } from '../../interfaces/juridiction';
import { ContentieuxOptionsService } from '../../services/contentieux-options/contentieux-options.service';
import { MatTableModule } from '@angular/material/table';

import { PopupComponent } from '../../components/popup/popup.component';
import { FormsModule } from '@angular/forms';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';

interface BackupOptionSelection {
  id: number;
  label: string;
  juridictions: number[];
}

@Component({
  standalone: true,
  imports: [
    MatTableModule,
    PopupComponent,
    FormsModule,
    WrapperComponent
],
  templateUrl: './backup-options.page.html',
  styleUrls: ['./backup-options.page.scss'],
})
export class BackupOptionsPage
  extends MainClass
  implements OnInit, AfterViewInit, OnDestroy
{
  contentieuxOptionsService = inject(ContentieuxOptionsService);
  displayedColumns: string[] = [
    'id',
    'backup-average-times',
    'juridictions',
    'actions',
  ];
  dataSource = [];
  juridictions: JuridictionInterface[] = [];
  backup: BackupOptionSelection | null = null;
  popupAction = [
    { id: 'save', content: 'Modifier', fill: true },
    { id: 'close', content: 'Fermer' },
  ];

  constructor() {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {}

  onLoad() {
    this.contentieuxOptionsService.getAll().then((elements) => {
      this.juridictions = elements.juridictions;
      this.dataSource = elements.list.map((u: any) => ({
        ...u,
        juridictionsString: u.juridictions
          .map((j: number) => {
            const juridiction = elements.juridictions.find(
              (ju: JuridictionInterface) => ju.id === j
            );
            if (juridiction) {
              return juridiction.label;
            }

            return null;
          })
          .filter((j: string | null) => j)
          .join('<br/>'),
      }));
    });
  }

  onEdit(b: BackupOptionSelection) {
    this.backup = JSON.parse(JSON.stringify(b));
  }

  onPopupDetailAction(action: any) {
    switch (action.id) {
      case 'save':
        {
          this.contentieuxOptionsService.updateBackup(this.backup).then(() => {
            this.backup = null;
            this.onLoad();
          });
        }
        break;
      case 'close':
        this.backup = null;
        break;
    }
  }

  onChangeSelection(juridictionId: number, event: boolean) {
    if (this.backup) {
      this.backup.juridictions = this.backup.juridictions || [];
      const findIndex = this.backup?.juridictions.indexOf(juridictionId);
      if (event && findIndex === -1) {
        this.backup.juridictions.push(juridictionId);
      } else if (!event && findIndex !== -1) {
        this.backup.juridictions.splice(findIndex, 1);
      }
    }
  }
}
