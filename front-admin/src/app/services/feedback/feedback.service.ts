import { inject, Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';
import {
  FeedbackInterface,
  FeedbackStatsInterface,
} from '../../interfaces/feedback';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  serverService = inject(ServerService);

  getAll() {
    return this.serverService
      .get('feedback/get-all')
      .then((data) => (data.data || []) as FeedbackInterface[]);
  }

  getStats() {
    return this.serverService
      .get('feedback/stats')
      .then((data) => data.data as FeedbackStatsInterface);
  }
}
