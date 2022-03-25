import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import { HumanResourceService } from '../human-resource/human-resource.service';

@Injectable({
  providedIn: 'root',
})
export class HRCommentService {
  constructor(
    private serverService: ServerService,
    private humanResourceService: HumanResourceService
  ) {}

  getHRComment(id: number) {
    return this.serverService
      .post('hr-comment/get-hr-comment', {
        hrId: id,
      })
      .then((r) => r.data);
  }

  updateHRComment(id: number, comment: string) {
    return this.serverService
      .post('hr-comment/update-hr-comment', {
        hrId: id,
        comment,
      })
      .then((r) => {
        const updateAt = new Date(r.data);
        const list = this.humanResourceService.hr.getValue();
        const index = list.findIndex((hr) => hr.id === id);
        if (index !== -1) {
          list[index].comment = comment;
          list[index].updatedAt = updateAt;
          this.humanResourceService.hr.next(list);
        }

        return updateAt;
      });
  }
}
