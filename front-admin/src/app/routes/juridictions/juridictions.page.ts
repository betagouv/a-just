import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MainClass } from '../../libs/main-class';
import { JuridictionInterface } from '../../interfaces/juridiction';
import { JuridictionsService } from '../../services/juridictions/juridictions.service';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { PopupComponent } from '../../components/popup/popup.component';
import { HumanResourceService } from '../../services/human-resource/human-resource.service';
import { compare } from '../../utils/array';

@Component({
  standalone: true,
  imports: [WrapperComponent, PopupComponent, MatSortModule, FormsModule],
  templateUrl: './juridictions.page.html',
  styleUrls: ['./juridictions.page.scss'],
})
export class JuridictionsPage extends MainClass implements OnInit {
  juridictionsService = inject(JuridictionsService);
  humanResourceService = inject(HumanResourceService);
  datas: JuridictionInterface[] = [];
  datasSource: JuridictionInterface[] = [];
  selectedJuridiction: JuridictionInterface | null = null;
  juridictionList: JuridictionInterface[] = [];
  duplicateSourceId: number | null = null;
  duplicateCopyActivity = false;
  duplicateExcludeFromStats = false;

  constructor() {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.humanResourceService.getBackupList().then((datas: any) => {
      this.juridictionList = datas;
    });
    this.juridictionsService.getAll().then((datas) => {
      this.datas = datas;
      this.datasSource = this.datas.slice();
    });
  }

  sortData(sort: Sort) {
    const data = this.datas.slice();
    if (!sort.active || sort.direction === '') {
      this.datasSource = data;
      return;
    }

    this.datasSource = data.sort((a, b) =>
      // @ts-ignore
      compare(a[sort.active], b[sort.active], sort.direction === 'asc'),
    );
  }

  onUpdate(node: string, element: any) {
    element = { ...element };
    let getValue = null;

    if (node !== 'enabled') {
      const newValue = prompt(
        `Remplacer le champ '${node}' par`,
        element[node] || '',
      );
      if (newValue !== null && element[node] !== newValue) {
        element[node] = newValue;
        getValue = true;
      }
    } else {
      if (confirm("Inverser l'activitation de la juridiction ?")) {
        element[node] = !element[node];
        element[node] = element[node] ? 'oui' : 'non';

        getValue = true;
      }
    }

    if (getValue !== null) {
      this.juridictionsService
        .updateJuridiction(node, element[node], element.id)
        .then(() => this.onLoad());
    }
  }

  getInitials(firstName?: string, lastName?: string) {
    return `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase();
  }

  duplicate() {
    if (!this.duplicateSourceId) {
      return alert('Veuillez sélectionner une juridiction');
    }

    const backupName = prompt(
      'Quel nom souhaitez-vous donner à cette nouvelle juridiction ?',
    );

    if (backupName && backupName.length > 0) {
      const juridiction =
        this.juridictionList.find((j) => j.id === this.duplicateSourceId) ||
        null;
      this.juridictionsService.duplicateJuridiction(
        backupName,
        this.duplicateSourceId,
        juridiction !== null ? juridiction.label : '',
        this.duplicateCopyActivity,
        this.duplicateExcludeFromStats,
      );
    }
  }
}
