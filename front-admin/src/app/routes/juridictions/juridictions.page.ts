import { Component, inject, OnInit } from '@angular/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MainClass } from '../../libs/main-class';
import { JuridictionInterface } from '../../interfaces/juridiction';
import { JuridictionsService } from '../../services/juridictions/juridictions.service';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { PopupComponent } from '../../components/popup/popup.component';
import { HumanResourceService } from '../../services/human-resource/human-resource.service';

@Component({
  standalone: true,
  imports: [WrapperComponent, PopupComponent, MatSortModule],
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

  constructor() {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  onLoad() {
    this.humanResourceService.getBackupList().then((datas: any) => {
      datas.map((elem: JuridictionInterface) =>
        this.juridictionList.push(elem)
      );
    });
    this.juridictionsService.getAll().then((datas) => {
      this.datas = datas;
      this.datasSource = this.datas.slice();
    });
  }

  onUpdate(node: string, element: any) {
    let getValue = null;

    if (node !== 'enabled') {
      getValue = prompt(
        `Remplacer le champ '${node}' par`,
        element[node] || ''
      );
    } else {
      getValue = confirm('Activer ou non la juridiction ?');
    }

    if (getValue !== null) {
      element[node] = !element[node];
      this.juridictionsService
        .updateJuridiction(node, element[node], element.id)
        .then(() => this.onLoad());
    }
  }

  sortData(sort: Sort) {
    const data = this.datas.slice();
    if (!sort.active || sort.direction === '') {
      this.datasSource = data;
      return;
    }

    this.datasSource = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      // @ts-ignore
      return compare(a[sort.active], b[sort.active], isAsc);
    });
  }

  duplicate(form: any) {
    if (!form.juridiction.value) {
      return alert('Veuillez sélectionner une juridiction');
    }
    const backupId = Number(form.juridiction.value);

    const backupName = prompt(
      'Quel nom souhaitez-vous donner à cette nouvelle juridiction ?'
    );

    if (backupName && backupName.length > 0) {
      const juridiction =
        this.juridictionList.find((j) => j.id === backupId) || null;
      this.juridictionsService.duplicateJuridiction(
        backupName,
        backupId,
        juridiction !== null ? juridiction.label : '',
        form.copyActivity.checked,
        form.excludeJuridiction.checked
      );
    }
  }
}
