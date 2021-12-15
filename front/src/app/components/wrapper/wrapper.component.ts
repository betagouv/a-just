import { Component, Input, OnInit, TemplateRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'aj-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent implements OnInit {
  @Input() actionTemplate: TemplateRef<any> | undefined;
  @Input() title: string = "";
  menu = [
    {
      label: 'Tribunal judiciaire',
      path: 'dashboard',
    },
    {
      label: 'Ventilations',
      path: 'ventilations',
    },
    {
      label: 'Données d\'activité',
      path: 'donnees-d-activite',
    },
    {
      label: 'Temps moyens',
      path: 'temps-moyens',
    },
    {
      label: 'Calculateur',
      path: 'calculateur',
    },
  ];
  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {}

  onDisconnect() {
    this.authService.onLogout().then(() => {
      this.router.navigate(["/"]);
    });
  }
}
