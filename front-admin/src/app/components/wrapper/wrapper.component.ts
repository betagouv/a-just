import {
  Component,
  inject,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MainClass } from '../../libs/main-class';
import { AuthService } from '../../services/auth/auth.service';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user/user.service';
import { USER_ROLE_SUPER_ADMIN } from '../../constants/roles';

const MENU = [
  {
    label: 'Utilisateurs',
    path: 'users',
    isSuperAdmin: false,
  },
  {
    label: 'Temps moyens de référentiel',
    path: 'backup-options',
    isSuperAdmin: false,
  },
  {
    label: 'Référentiel',
    path: 'referentiel',
    isSuperAdmin: false,
  },
  {
    label: 'Imports',
    path: 'imports',
    isSuperAdmin: true,
  },
  {
    label: 'Notifications',
    path: 'news',
    isSuperAdmin: false,
  },
  {
    label: 'Juridictions',
    path: 'juridictions',
    isSuperAdmin: false,
  },
  {
    label: 'Yaml tools',
    path: 'yaml-tools',
    isSuperAdmin: false,
  },
  {
    label: 'Data',
    path: 'data',
    isSuperAdmin: false,
  },
  {
    label: 'Tests autom',
    path: 'tests-autom',
    isSuperAdmin: false,
  },
];

@Component({
  selector: 'aj-wrapper',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent extends MainClass implements OnInit, OnDestroy {
  authService = inject(AuthService);
  router = inject(Router);
  userService = inject(UserService);
  @Input() actionTemplate: TemplateRef<any> | undefined;
  @Input() title: string = '';
  menu: { label: string; path: string; isSuperAdmin: boolean }[] = [];

  ngOnInit() {
    this.userService.user.subscribe((user) => {
      if (user) {
        if (user.role === USER_ROLE_SUPER_ADMIN) {
          this.menu = [...MENU];
        } else {
          this.menu = [...MENU].filter((item) => {
            return !item.isSuperAdmin;
          });
        }
      }
    });
  }

  ngOnDestroy() {}

  onDisconnect() {
    this.authService.onLogout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
