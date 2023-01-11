import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { JuridictionInterface } from 'src/app/interfaces/juridiction';
import { UserInterface } from 'src/app/interfaces/user-interface';
import { MainClass } from 'src/app/libs/main-class';
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service';

interface BackupOptionSelection {
  id: number;
  label: string;
  juridictions: number[];
}

@Component({
  templateUrl: './backup-options.page.html',
  styleUrls: ['./backup-options.page.scss'],
})
export class BackupOptionsPage
  extends MainClass
  implements OnInit, AfterViewInit, OnDestroy
{
  displayedColumns: string[] = [
    'id',
    'backup-average-times',
    'juridictions',
    'actions',
  ];
  dataSource = new MatTableDataSource();
  juridictions: JuridictionInterface[] = [];
  backup: BackupOptionSelection | null = null;
  popupAction = [
    { id: 'save', content: 'Modifier', fill: true },
    { id: 'close', content: 'Fermer' },
  ];

  constructor(private contentieuxOptionsService: ContentieuxOptionsService) {
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
      this.dataSource.data = elements.list.map((u: any) => ({
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
