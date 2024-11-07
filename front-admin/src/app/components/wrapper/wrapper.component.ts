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
  @Input() actionTemplate: TemplateRef<any> | undefined;
  @Input() title: string = '';
  menu = [
    {
      label: 'Utilisateurs',
      path: 'users',
    },
    {
      label: 'Temps moyens de référentiel',
      path: 'backup-options',
    },
    {
      label: 'Référentiel',
      path: 'referentiel',
    },
    {
      label: 'Imports',
      path: 'imports',
    },
    {
      label: 'Notifications',
      path: 'news',
    },
    {
      label: 'Juridictions',
      path: 'juridictions',
    },
    {
      label: 'Yaml tools',
      path: 'yaml-tools',
    },
    {
      label: 'Data',
      path: 'data',
    },
  ];

  ngOnInit() {}

  ngOnDestroy() {}

  onDisconnect() {
    this.authService.onLogout().then(() => {
      this.router.navigate(['/']);
    });
  }
}
