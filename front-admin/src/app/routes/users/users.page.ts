import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { JuridictionInterface } from 'src/app/interfaces/juridiction';
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
export class UsersPage extends MainClass implements OnInit, AfterViewInit, OnDestroy {
  displayedColumns: string[] = [
    'id',
    'email',
    'firstName',
    'lastName',
    'roleName',
    'access',
    'actions',
  ];
  dataSource = new MatTableDataSource();
  access: FormSelection[] = [];
  juridictions: FormSelection[] = [];
  userEdit: UserInterface | null = null;
  popupAction = [
    { id: 'save', content: 'Modifier', fill: true },
    { id: 'close', content: 'Fermer' },
  ];

  constructor(private userService: UserService) {
    super();
  }

  ngOnInit() {
    this.onLoad();
  }

  ngAfterViewInit () {}

  ngOnDestroy() {}

  onLoad() {
    this.userService.getAll().then(l => {
      this.dataSource.data = l.list.map((u: UserInterface) => ({
        ...u,
        accessName: (u.accessName || '').replace(/, /g,', <br/>')
      }));
      this.access = l.access.map((u: PageAccessInterface) => ({id: u.id, label: u.label, selected: false}));
      this.juridictions = l.juridictions.map((u: JuridictionInterface) => ({id: u.id, label: u.label, selected: false}));
    });
  }

  onEdit(user: UserInterface) {
    this.userEdit = user;

    this.access = this.access.map(u => {
      return {
        ...u,
        selected: (user.access || []).indexOf(u.id) !== -1 ? true : false
      }
    });

    this.juridictions = this.juridictions.map(u => {
      return {
        ...u,
        selected: (user.juridictions || []).find(j => j.id === u.id) ? true : false
      }
    });
  }

  onPopupDetailAction (action: any) {
    switch (action.id) {
    case 'save': {
      console.log(this.access.filter(a => a.selected), this.juridictions.filter(a => a.selected))

      // this.onSubmit()
    } break
    case 'close':
      this.userEdit = null
      break
    }
  }
}
