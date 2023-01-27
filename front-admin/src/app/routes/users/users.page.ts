import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { MatLegacyTableDataSource as MatTableDataSource } from '@angular/material/legacy-table';
import { BackupInterface } from 'src/app/interfaces/backup';
import { PageAccessInterface } from 'src/app/interfaces/page-access-interface';
import { UserInterface } from 'src/app/interfaces/user-interface';
import { MainClass } from 'src/app/libs/main-class';
import { UserService } from 'src/app/services/user/user.service';

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
  implements OnInit, AfterViewInit, OnDestroy
{
  displayedColumns: string[] = [
    'id',
    'email',
    'firstName',
    'lastName',
    'tj',
    'fonction',
    'access',
    'ventilationsName',
    'actions',
  ];
  dataSource = new MatTableDataSource();
  access: FormSelection[] = [];
  ventilations: FormSelection[] = [];
  userEdit: UserInterface | null = null;
  userConnected: UserInterface | null = null;
  popupAction = [
    { id: 'save', content: 'Modifier', fill: true },
    { id: 'close', content: 'Fermer' },
  ];

  constructor(private userService: UserService) {
    super();

    this.watch(
      this.userService.user.subscribe((u) => (this.userConnected = u))
    );
  }

  ngOnInit() {
    this.onLoad();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onLoad() {
    this.userService.getAll().then((l) => {
      this.dataSource.data = l.list.map((u: UserInterface) => ({
        ...u,
        accessName: (u.accessName || '').replace(/, /g, ', <br/>'),
        ventilationsName: (u.ventilations || [])
          .map((j) => j.label)
          .join(', <br/>'),
      }));
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
}
