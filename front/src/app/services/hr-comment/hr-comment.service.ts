import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class HRCommentService {
  constructor(private serverService: ServerService) {}

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
      .then((r) => r.data);
  }
}
