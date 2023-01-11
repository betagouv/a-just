import { Injectable } from '@angular/core';
import { NewsInterface } from 'src/app/interfaces/news';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  constructor(private serverService: ServerService) {}

  getAll() {
    return this.serverService
      .get('news/get-all')
      .then((data) => data.data || []);
  }

  updateOrCreate(news: NewsInterface) {
    return this.serverService
      .post('news/update-create', news)
      .then((data) => data.data || null);
  }

  remove(newsId: number) {
    return this.serverService
      .post('news/remove', { newsId })
      .then((data) => data.data || null);
  }
}
