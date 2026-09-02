import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import { GroupsResponseInterface } from '../../interfaces/groups.interface';

@Injectable({
  providedIn: 'root',
})
export class GroupsService {
  private readonly http = inject(HttpClient);

  listGroups() {
    return this.http
      .get<GroupsResponseInterface>('groups/list-groups')
      .pipe(map((data) => data.data));
  }

  assignHrBackups(groupId: number | null, backupIds: number[]) {
    return this.http.post('groups/assign-hr-backups', {
      ...(groupId !== null ? { groupId } : {}),
      backupIds,
    });
  }

  createGroup(label: string) {
    return this.http.post('groups/create-group', { label });
  }

  updateGroup(groupId: number, label: string) {
    return this.http.post('groups/update-group', { groupId, label });
  }

  removeGroup(groupId: number) {
    return this.http.post('groups/remove-group', { groupId });
  }
}
