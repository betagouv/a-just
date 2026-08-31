import { Component, inject, OnInit } from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { GroupsService } from '../../services/groups/groups.service';
import { Group } from '../../interfaces/groups.interface';
import { BackupInterface } from '../../interfaces/backups.interface';

@Component({
  standalone: true,
  imports: [WrapperComponent, CdkDropListGroup, CdkDropList, CdkDrag],
  templateUrl: './groups.page.html',
  styleUrls: ['./groups.page.scss'],
})
export class GroupsPage implements OnInit {
  groupsService = inject(GroupsService);
  groups: Group[] = [];
  hrbackupAlone: BackupInterface[] = [];

  ngOnInit() {
    this.loadGroups();
  }

  createGroup() {
    const label = window.prompt('Nom du groupe')?.trim();
    if (!label) {
      return;
    }
    this.groupsService.createGroup(label).subscribe(() => this.loadGroups());
  }

  renameGroup(group: Group) {
    const label = window.prompt('Nouveau nom du groupe', group.label)?.trim();
    if (!label || label === group.label) {
      return;
    }
    this.groupsService
      .updateGroup(group.id, label)
      .subscribe(() => this.loadGroups());
  }

  deleteGroup(group: Group) {
    if (
      !window.confirm(
        `Supprimer le groupe « ${group.label} » ? Les juridictions associées seront retirées du groupe.`,
      )
    ) {
      return;
    }
    this.groupsService.removeGroup(group.id).subscribe(() => this.loadGroups());
  }

  private loadGroups() {
    this.groupsService.listGroups().subscribe((data) => {
      this.groups = (data.groups || []).map((group) => ({
        ...group,
        backups: [...(group.backups || [])],
      }));
      this.hrbackupAlone = [...(data.hrbackupAlone || [])];
    });
  }

  onDrop(event: CdkDragDrop<BackupInterface[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
      this.saveList(event.previousContainer.data);
    }

    this.saveList(event.container.data);
  }

  private saveList(list: BackupInterface[]) {
    const group = this.groups.find((g) => g.backups === list);
    this.groupsService
      .assignHrBackups(
        group?.id ?? null,
        list.map((backup) => backup.id),
      )
      .subscribe();
  }
}
