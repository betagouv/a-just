import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MainClass } from '../../libs/main-class';
import { UserInterface } from '../../interfaces/user-interface';
import { UserService } from '../../services/user/user.service';
import { PopupComponent } from '../../components/popup/popup.component';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';

import { FormsModule } from '@angular/forms';
import { PageAccessInterface } from '../../interfaces/page-access-interface';
import { BackupInterface } from '../../interfaces/backup';
import { compare } from '../../utils/array';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';
import { ReferentielService } from '../../services/referentiel/referentiel.service';
import { AppService } from '../../services/app/app.service';

interface FormSelection {
  id: number;
  label: string;
  selected: boolean;
}

@Component({
  standalone: true,
  imports: [PopupComponent, WrapperComponent, MatSortModule, FormsModule],
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage extends MainClass implements OnInit, OnDestroy {
  appService = inject(AppService);
  referentielService = inject(ReferentielService);
  userService = inject(UserService);
  datas: UserInterface[] = [];
  datasSource: UserInterface[] = [];
  referentiels: FormSelection[] = [];
  access: FormSelection[] = [];
  ventilations: FormSelection[] = [];
  userEdit: UserInterface | null = null;
  userDelete: UserInterface | null = null;
  userConnected: UserInterface | null = null;
  sort: Sort | null = null;
  popupAction = [
    { id: 'save', content: 'Modifier', fill: true },
    { id: 'close', content: 'Fermer' },
  ];
  popupDeleteAction = [
    { id: 'confirm', content: 'Confirmer', fill: true, red: true },
    { id: 'cancel', content: 'Annuler' },
  ];

  constructor() {
    super();

    this.watch(
      this.userService.user.subscribe((u) => (this.userConnected = u))
    );
  }

  ngOnInit() {
    this.onLoad();
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  async onLoad() {
    this.appService.isLoading.next(true);
    await this.referentielService
      .getReferentiels(true)
      .then((r: ContentieuReferentielInterface[]) => {
        this.referentiels = r.map((u) => ({
          id: u.id,
          label: u.label,
          selected: false,
        }));
      });
    this.userService
      .getAll()
      .then((l) => {
        this.datas = l.list.map((u: UserInterface) => ({
          ...u,
          accessName: (u.accessName || '').replace(/, /g, ', <br/>'),
          referentielName:
            u.referentielIds === null
              ? 'Tous'
              : (u.referentielIds || [])
                  .map(
                    (id) => this.referentiels.find((r) => r.id === id)?.label
                  )
                  .filter((label) => label !== 'Indisponibilité')
                  .join(', <br/>'),
          ventilationsName: (u.ventilations || [])
            .map((j) => j.label)
            .join(', <br/>'),
        }));
        this.datasSource = this.datas.slice();

        this.access = l.access.map((u: PageAccessInterface) => ({
          id: u.id,
          label: u.label,
          selected: false,
        }));
        this.ventilations = l.ventilations.map((u: BackupInterface) => ({
          id: u.id,
          label: u.label,
          selected: false,
        }));

        this.sortData(
          this.sort
            ? this.sort
            : {
                active: 'id',
                direction: 'desc',
              }
        );
      })
      .finally(() => {
        this.appService.isLoading.next(false);
      });
  }

  sortData(sort: Sort) {
    this.sort = sort;
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

  onEdit(user: UserInterface) {
    if (
      user &&
      user.role &&
      user.role === this.USER_ROLE_SUPER_ADMIN &&
      this.userConnected &&
      this.userConnected.role !== this.USER_ROLE_SUPER_ADMIN
    ) {
      alert(
        "Vous n'avez pas le droit de modifier les droits d'un super administrateur."
      );
      return;
    }

    this.userEdit = user;

    this.access = this.access.map((u) => {
      return {
        ...u,
        selected: (user.access || []).indexOf(u.id) !== -1 ? true : false,
      };
    });

    this.ventilations = this.ventilations.map((u) => {
      return {
        ...u,
        selected: (user.ventilations || []).find((j) => j.id === u.id)
          ? true
          : false,
      };
    });

    this.referentiels = this.referentiels.map((u) => {
      return {
        ...u,
        selected:
          (user.referentielIds || []).indexOf(u.id) !== -1 ||
          user.referentielIds === null
            ? true
            : false,
      };
    });
  }

  onPopupDetailAction(action: any) {
    switch (action.id) {
      case 'save':
        {
          this.userService
            .updateUser({
              userId: this.userEdit && this.userEdit.id,
              access: this.access.filter((a) => a.selected).map((a) => a.id),
              ventilations: this.ventilations
                .filter((a) => a.selected)
                .map((a) => a.id),
              referentielIds:
                this.referentiels.filter((a) => a.selected).length ===
                this.referentiels.length
                  ? null
                  : this.referentiels
                      .filter((a) => a.selected)
                      .map((a) => a.id),
            })
            .then(() => {
              this.userEdit = null;
              this.onLoad();
            });
        }
        break;
      case 'close':
        this.userEdit = null;
        break;
    }
  }

  onDelete(user: UserInterface) {
    if (
      user &&
      user.role &&
      user.role === this.USER_ROLE_SUPER_ADMIN &&
      this.userConnected &&
      this.userConnected.role !== this.USER_ROLE_SUPER_ADMIN
    ) {
      alert("Vous n'avez pas le droit de supprimer un super administrateur.");
      return;
    }
    this.userDelete = user;
  }

  onPopupDeleteAction(action: any) {
    switch (action.id) {
      case 'confirm':
        {
          const userId = this.userDelete && this.userDelete.id;
          if (userId) {
            this.userService.deleteUser(userId).then(() => {
              this.userDelete = null;
              this.onLoad();
            });
          }
        }
        break;
      case 'cancel':
        this.userDelete = null;
        break;
    }
  }
}
