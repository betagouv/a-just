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
import { BackupInterface } from '../../interfaces/backup';

interface ContentieuReferentielWithBackupsInterface
  extends ContentieuReferentielInterface {
  backups: dataInterface[] | null;
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
  backups: dataInterface[] = [];
  isJirs: boolean = true;

  constructor() {
    super();
  }

  ngOnInit() {
    this.onLoadJuridicitons();
  }

  onLoadJuridicitons() {
    this.juridictionsService.getAllBackup().then((datas) => {
      this.backups = datas.map((d: BackupInterface) => ({
        id: d.id,
        value: d.label,
      }));

      this.onLoad();
    });
  }

  onLoad() {
    this.referentielService
      .getReferentiels(this.isJirs)
      .then((list: ContentieuReferentielInterface[]) => {
        this.referentiels = list
          .map((i) => ({
            ...i,
            backups: i.onlyToHrBackup
              ? this.backups.filter((b) => i.onlyToHrBackup?.includes(b.id))
              : null,
            childrens: (i.childrens || []).map((c) => ({
              ...c,
              backups: i.onlyToHrBackup
                ? this.backups.filter((b) => c.onlyToHrBackup?.includes(b.id))
                : null,
            })),
          }))
          .map((i) => ({
            ...i,
            backups: i.backups && i.backups.length === 0 ? null : i.backups,
            childrens: (i.childrens || []).map((c) => ({
              ...c,
              backups: c.backups && c.backups.length === 0 ? null : c.backups,
            })),
          }));
      });
  }

  onUpdateElement(id: number, node: string, value: any) {
    this.referentielService.update(id, node, value);
  }
}
