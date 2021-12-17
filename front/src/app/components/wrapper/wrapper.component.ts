import { Component, Input, OnDestroy, OnInit, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { UserInterface } from 'src/app/interfaces/user-interface';
import { MainClass } from 'src/app/libs/main-class';
import { AuthService } from 'src/app/services/auth/auth.service';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'aj-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent extends MainClass implements OnInit, OnDestroy {
  @Input() actionTemplate: TemplateRef<any> | undefined;
  @Input() title: string = "";
  menu = [{
    label: 'Tribunal judiciaire',
    path: 'dashboard',
  }];
  
  constructor(private authService: AuthService, private router: Router, private userService: UserService) {
    super();
  }

  ngOnInit() {
    this.watch(this.userService.user.subscribe((u) => {
      this.updateMenu(u);
    }))
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onDisconnect() {
    this.authService.onLogout().then(() => {
      this.router.navigate(["/"]);
    });
  }

  updateMenu(user: UserInterface | null) {
    const menu = [];

    if(user && user.access && user.access.indexOf(1) !== -1) {
      menu.push({
        label: 'Tribunal judiciaire',
        path: 'dashboard',
      });
    }

    if(user && user.access && user.access.indexOf(2) !== -1) {
      menu.push({
        label: 'Ventilations',
        path: 'ventilations',
      });
    }

    if(user && user.access && user.access.indexOf(3) !== -1) {
      menu.push({
        label: 'Données d\'activité',
        path: 'donnees-d-activite',
      });      
    }

    if(user && user.access && user.access.indexOf(4) !== -1) {
      menu.push({
        label: 'Temps moyens',
        path: 'temps-moyens',
      });      
    }

    if(user && user.access && user.access.indexOf(5) !== -1) {
      menu.push({
        label: 'Calculateur',
        path: 'calculateur',
      });      
    }

    this.menu = menu;
  }
}
