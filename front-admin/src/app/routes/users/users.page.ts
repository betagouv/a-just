import { Component, OnDestroy, OnInit } from '@angular/core';
import { Sort } from '@angular/material/sort';
import { BackupInterface } from 'src/app/interfaces/backup';
import { PageAccessInterface } from 'src/app/interfaces/page-access-interface';
import { UserInterface } from 'src/app/interfaces/user-interface';
import { MainClass } from 'src/app/libs/main-class';
import { UserService } from 'src/app/services/user/user.service';
import { compare } from 'src/app/utils/array';

interface FormSelection {
  id: number;
  label: string;
  selected: boolean;
}

@Component({
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage
  extends MainClass
  implements OnInit, OnDestroy
{
  datas: UserInterface[] = [];
  datasSource: UserInterface[] = [];
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
  ]

  constructor(private userService: UserService) {
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

  onLoad() {
    this.userService.getAll().then((l) => {
      this.datas = l.list.map((u: UserInterface) => ({
        ...u,
        accessName: (u.accessName || '').replace(/, /g, ', <br/>'),
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

      this.sortData(this.sort ? this.sort : {
        active: "id", 
        direction: "desc"
      })
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
      alert(
        "Vous n'avez pas le droit de supprimer un super administrateur."
      );
      return;
    }
    this.userDelete = user
  }


  onPopupDeleteAction(action: any) {
    switch (action.id) {
      case 'confirm':
        {
          const userId = this.userDelete && this.userDelete.id
          if (userId) {
            this.userService
            .deleteUser(userId)
            .then(() => {
              this.userDelete = null;
              this.onLoad();
            })
        
          }
        }
        break;
      case 'cancel':
        this.userDelete = null;
        break;
    }
  }
}
