import { Component, inject, OnInit } from '@angular/core';
import { MainClass } from '../../libs/main-class';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';
import { QUALITY_LIST } from '../../constants/referentiels';
import { ReferentielService } from '../../services/referentiel/referentiel.service';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  dataInterface,
  SelectComponent,
} from '../../components/select/select.component';
import { JuridictionsService } from '../../services/juridictions/juridictions.service';
import { BackupGroupInterface, BackupInterface } from '../../interfaces/backup';
import { difference } from 'lodash';

interface ContentieuReferentielWithBackupsInterface
  extends ContentieuReferentielInterface {
  backups: dataInterface[] | null;
}

interface customDataInterface extends dataInterface {
  groups?: BackupGroupInterface[];
}

@Component({
  standalone: true,
  imports: [WrapperComponent, FormsModule, CommonModule, SelectComponent],
  templateUrl: './referentiel.page.html',
  styleUrls: ['./referentiel.page.scss'],
})
export class ReferentielPage extends MainClass implements OnInit {
  referentielService = inject(ReferentielService);
  juridictionsService = inject(JuridictionsService);
  referentiels: ContentieuReferentielWithBackupsInterface[] = [];
  QUALITY_LIST = QUALITY_LIST;
  backups: customDataInterface[] = [];
  isJirs: boolean = true;

  constructor() {
    super();
  }

  ngOnInit() {
    this.onLoadJuridicitons();
  }

  onLoadJuridicitons() {
    this.juridictionsService.getAllBackup().then((datas) => {
      const allBackups = datas.map((d: BackupInterface) => ({
        id: d.id,
        value:
          (d.groups && d.groups.length ? d.groups[0].label + ' - ' : '') +
          d.label,
        groups: d.groups,
      }));

      this.backups = [
        ...allBackups.filter((a: any) => a.groups && a.groups.length),
        ...allBackups.filter((a: any) => !a.groups || !a.groups.length),
      ];

      this.onLoad();
    });
  }

  onLoad() {
    this.referentielService
      .getReferentiels(this.isJirs)
      .then((list: ContentieuReferentielInterface[]) => {
        this.referentiels = list.map((i) => ({
          ...i,
          backups:
            i.onlyToHrBackup !== null
              ? this.backups.filter((b) => i.onlyToHrBackup?.includes(b.id))
              : null,
          childrens: (i.childrens || []).map((c) => ({
            ...c,
            backups:
              c.onlyToHrBackup !== null
                ? this.backups.filter((b) => c.onlyToHrBackup?.includes(b.id))
                : null,
          })),
        }));
      });
  }

  onUpdateElement(
    item: ContentieuReferentielWithBackupsInterface,
    node: string,
    value: any
  ) {
    if (
      confirm(
        'Voulez-vous vraiment modifier le referentiel ? Cela va prendre plusieurs minutes et monopoliser un docker. Seul la sandbox sera blocké car elle a un seul docker mais les autres seront toujours accessibles.'
      )
    ) {
      if (node === 'onlyToHrBackup' && Array.isArray(value)) {
        let isOnAdd: boolean | null = null;
        let deltaToUpdate = difference(value, item.onlyToHrBackup || []);
        if (deltaToUpdate.length) {
          isOnAdd = true;
        }

        if (isOnAdd === null) {
          deltaToUpdate = difference(item.onlyToHrBackup || [], value);
          if (deltaToUpdate.length) {
            isOnAdd = false;
          }
        }

        if (isOnAdd !== null) {
          const backupElements = this.backups.filter((b) =>
            deltaToUpdate.includes(b.id)
          );
          backupElements.map((backupElements) => {
            const groups = backupElements.groups || [];
            if (groups.length) {
              groups.map((group) => {
                const allids = this.backups
                  .filter((b) =>
                    (b.groups || []).some((g) => g.id === group.id)
                  )
                  .map((b) => b.id);
                allids.map((id) => {
                  if (isOnAdd) {
                    if (!value.includes(id)) {
                      value.push(id);
                    }
                  } else {
                    if (value.includes(id)) {
                      value = value.filter((v: number) => v !== id);
                    }
                  }
                });
              });
            }
          });
        }

        item.onlyToHrBackup = [...value];
      }

      this.referentielService.update(item.id, node, value);
    }
  }
}
