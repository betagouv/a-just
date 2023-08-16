import { Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { MainClass } from 'src/app/libs/main-class';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'aj-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent extends MainClass implements OnInit, OnDestroy {
  @Input() actionTemplate: TemplateRef<any> | undefined;
  @Input() title: string = "";
  menu = [{
    label: 'Utilisateurs',
    path: 'users',
  }, {
    label: 'Temps moyens de référentiel',
    path: 'backup-options',
  }, {
    label: 'Imports',
    path: 'imports',
  }, {
    label: 'Notifications',
    path: 'news',
  }, {
    label: 'Juridictions',
    path: 'juridictions',
  },  {
    label: 'Analyse de données',
    path: 'data-analyse',
  }];
  
  constructor(private authService: AuthService, private router: Router) {
    super();
  }

  ngOnInit() {}

  ngOnDestroy() {}

  onDisconnect() {
    this.authService.onLogout().then(() => {
      this.router.navigate(["/"]);
    });
  }
}
