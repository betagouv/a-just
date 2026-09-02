import {
  AfterViewChecked,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MainClass } from '../../libs/main-class';
import { UserInterface } from '../../interfaces/user-interface';
import { UserService } from '../../services/user/user.service';
import { PopupComponent } from '../../components/popup/popup.component';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';

import { FormsModule } from '@angular/forms';
import { BackupInterface } from '../../interfaces/backups.interface';
import { compare } from '../../utils/array';
import { ContentieuReferentielInterface } from '../../interfaces/contentieu-referentiel';
import { ReferentielService } from '../../services/referentiel/referentiel.service';
import { AppService } from '../../services/app/app.service';
import { GroupInterface } from '../../interfaces/groups.interface';

interface FormSelection {
  id: number;
  label: string;
  selected: boolean;
}

interface FormVentilationSelection {
  id: number;
  label: string;
  hasAccess: boolean;
  isLocalAdmin: boolean;
}

interface FormVentilationGroup {
  id: number;
  label: string;
  items: FormVentilationSelection[];
  expanded: boolean;
}

@Component({
  standalone: true,
  imports: [PopupComponent, WrapperComponent, MatSortModule, FormsModule],
  templateUrl: './users.page.html',
  styleUrls: ['./users.page.scss'],
})
export class UsersPage
  extends MainClass
  implements OnInit, OnDestroy, AfterViewChecked
{
  appService = inject(AppService);
  referentielService = inject(ReferentielService);
  userService = inject(UserService);
  elementRef = inject(ElementRef);
  datas: UserInterface[] = [];
  datasSource: UserInterface[] = [];
  referentiels: FormSelection[] = [];
  access: {
    name: string;
    label: string;
    orderRequired: boolean;
    access: FormSelection[];
  }[] = [];
  groups: GroupInterface[] = [];
  ventilations: FormVentilationSelection[] = [];
  ventilationGroups: FormVentilationGroup[] = [];
  ventilationsWithoutGroup: FormVentilationSelection[] = [];
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
      this.userService.user.subscribe((u) => (this.userConnected = u)),
    );
  }

  ngOnInit() {
    this.onLoad();
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  ngAfterViewChecked() {
    this.checkScrollableCells();
  }

  checkScrollableCells() {
    const wrappers = this.elementRef.nativeElement.querySelectorAll(
      '.scrollable-wrapper',
    );
    wrappers.forEach((wrapper: HTMLElement) => {
      const cell = wrapper.querySelector('.scrollable-cell') as HTMLElement;
      if (cell && cell.scrollHeight > cell.clientHeight) {
        wrapper.classList.add('has-scroll');
      } else {
        wrapper.classList.remove('has-scroll');
      }
    });
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
        this.access = l.access;
        this.groups = l.groups;

        this.datas = l.list.map((u: UserInterface) => {
          const accessLabels = this.convertAccessToLabels(u.access || []);
          const referentielLabels =
            u.referentielIds === null
              ? ['Tous']
              : (u.referentielIds || [])
                  .map(
                    (id) => this.referentiels.find((r) => r.id === id)?.label,
                  )
                  .filter(
                    (label): label is string =>
                      !!label && label !== 'Indisponibilité',
                  );
          const ventilationItems = (u.ventilations || []).map((j) => ({
            id: j.id,
            label: j.label,
            isLocalAdmin: (u.localAdminIds || []).includes(j.id),
          }));

          return {
            ...u,
            accessLabels,
            accessName: accessLabels.join(', '),
            referentielLabels,
            referentielName: referentielLabels.join(', '),
            ventilationItems,
            ventilationsName: ventilationItems
              .map((j) => (j.isLocalAdmin ? '★ ' : '') + j.label)
              .join(', '),
          };
        });
        this.datasSource = this.datas.slice();

        this.ventilations = l.ventilations.map((u: BackupInterface) => ({
          id: u.id,
          label: u.label,
          hasAccess: false,
          isLocalAdmin: false,
        }));
        this.buildVentilationGroups();

        this.sortData(
          this.sort
            ? this.sort
            : {
                active: 'id',
                direction: 'desc',
              },
        );
      })
      .finally(() => {
        this.appService.isLoading.next(false);
      });
  }

  /**
   * Répartit les ventilations dans leur groupe. Les objets sont partagés par
   * référence avec this.ventilations qui reste la source de vérité à la sauvegarde.
   */
  buildVentilationGroups() {
    const ventilationById = new Map(this.ventilations.map((v) => [v.id, v]));
    const groupedIds = new Set<number>();

    this.ventilationGroups = this.groups
      .map((group) => {
        const items = (group.backups || [])
          .map((backup) => ventilationById.get(backup.id))
          .filter((item): item is FormVentilationSelection => !!item);
        items.forEach((item) => groupedIds.add(item.id));

        return {
          id: group.id,
          label: group.label,
          items,
          expanded: false,
        };
      })
      .filter((group) => group.items.length > 0);

    this.ventilationsWithoutGroup = this.ventilations.filter(
      (v) => !groupedIds.has(v.id),
    );
  }

  groupAccessCount(group: FormVentilationGroup) {
    return group.items.filter((i) => i.hasAccess || i.isLocalAdmin).length;
  }

  groupLocalAdminCount(group: FormVentilationGroup) {
    return group.items.filter((i) => i.isLocalAdmin).length;
  }

  isGroupAllLocalAdmin(group: FormVentilationGroup) {
    return this.groupLocalAdminCount(group) === group.items.length;
  }

  onToggleGroupAccess(group: FormVentilationGroup, checked: boolean) {
    group.items.forEach((item) => {
      if (!item.isLocalAdmin) {
        item.hasAccess = checked;
      }
    });
  }

  onToggleGroupLocalAdmin(group: FormVentilationGroup, checked: boolean) {
    group.items.forEach((item) => (item.isLocalAdmin = checked));
  }

  selectionLabel(selected: number, total: number) {
    if (selected === 0) {
      return 'Non';
    }
    if (selected === total) {
      return 'Oui';
    }
    return `${selected}/${total}`;
  }

  convertAccessToLabels(access: number[]) {
    const list: string[] = [];
    this.access.forEach((a) => {
      a.access.map((b) => {
        if (access.includes(b.id)) {
          list.push(a.label + ' - ' + b.label);
        }
      });
    });

    return list;
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
        "Vous n'avez pas le droit de modifier les droits d'un super administrateur.",
      );
      return;
    }

    this.userEdit = user;

    this.ventilations = this.ventilations.map((u) => {
      return {
        ...u,
        hasAccess: (user.ventilations || []).find((j) => j.id === u.id)
          ? true
          : false,
        isLocalAdmin: (user.localAdminIds || []).includes(u.id) ? true : false,
      };
    });

    this.buildVentilationGroups();
    this.ventilationGroups.forEach((group) => {
      const accessCount = this.groupAccessCount(group);
      group.expanded = accessCount > 0 && accessCount < group.items.length;
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

  onChangeAccess(id: number, selected: boolean) {
    if (this.userEdit) {
      let access = this.userEdit.access || [];
      if (selected) {
        if (access.indexOf(id) === -1) {
          access.push(id);
        }
      } else {
        access = access.filter((a) => a !== id);
      }

      this.userEdit.access = [...access];
    }
  }

  onSelectAllAccess() {
    if (this.userEdit) {
      let access: number[] = [];
      this.access.map((group) => {
        (group.access || []).forEach((a) => access.push(a.id));
      });
      this.userEdit.access = [...access];
    }
  }

  onSelectAllContentieux() {
    if (this.userEdit) {
      this.referentiels = this.referentiels.map((a) => ({
        ...a,
        selected: true,
      }));
    }
  }

  onPopupDetailAction(action: any) {
    switch (action.id) {
      case 'save':
        {
          this.userService
            .updateUser({
              userId: this.userEdit && this.userEdit.id,
              access: this.userEdit && this.userEdit.access,
              ventilations: this.ventilations
                .filter((a) => a.hasAccess)
                .map((a) => a.id),
              localAdminIds: this.ventilations
                .filter((a) => a.isLocalAdmin)
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
