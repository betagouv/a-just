import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { BackupInterface } from 'src/app/interfaces/backup';
import { UserInterface } from 'src/app/interfaces/user-interface';
import { MainClass } from 'src/app/libs/main-class';
import { AuthService } from 'src/app/services/auth/auth.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  selector: 'aj-wrapper',
  templateUrl: './wrapper.component.html',
  styleUrls: ['./wrapper.component.scss'],
})
export class WrapperComponent extends MainClass implements OnInit, OnDestroy {
  @Input() actionTemplate: TemplateRef<any> | undefined;
  @Input() title: string = '';
  @Input() subtitle: string = '';
  hrBackup: BackupInterface | undefined;
  hrBackups: BackupInterface[] = [];
  menu = [
    {
      label: 'Panorama',
      path: 'dashboard',
    },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private humanResourceService: HumanResourceService
  ) {
    super();

    this.watch(
      this.userService.user.subscribe((u) => {
        this.updateMenu(u);
      })
    );

    this.watch(
      this.humanResourceService.backupId.subscribe((backupId) => {
        this.hrBackups = this.humanResourceService.backups.getValue();
        this.hrBackup = this.hrBackups.find(b => b.id === backupId)
      })
    );
  }

  ngOnInit() {
    
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  onDisconnect() {
    this.authService.onLogout().then(() => {
      this.router.navigate(['/']);
    });
  }

  updateMenu(user: UserInterface | null) {
    const menu = [];

    if (user && user.access && user.access.indexOf(1) !== -1) {
      menu.push({
        label: 'Panorama',
        path: 'dashboard',
      });
    }

    if (user && user.access && user.access.indexOf(2) !== -1) {
      menu.push({
        label: 'Éffectifs',
        path: 'ventilations',
      });
    }

    if (user && user.access && user.access.indexOf(3) !== -1) {
      menu.push({
        label: "Données d'activité",
        path: 'donnees-d-activite',
      });
    }

    if (user && user.access && user.access.indexOf(4) !== -1) {
      menu.push({
        label: 'Temps moyens',
        path: 'temps-moyens',
      });
    }

    if (user && user.access && user.access.indexOf(5) !== -1) {
      menu.push({
        label: 'Calculateur',
        path: 'calculateur',
      });
    }

    this.menu = menu;
  }

  isSelected(item: any) {
    return `/${item.path}` === window.location.pathname
  }

  onChangeHRBackup(id: number) {
    if(this.humanResourceService.hrIsModify.getValue() && !confirm('Vous avez des modifications en cours. Supprimer ?')) {
      return;
    }
    this.humanResourceService.backupId.next(id);
  }
}
