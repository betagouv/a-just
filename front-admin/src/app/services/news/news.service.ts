import { Injectable } from '@angular/core'
import { ServerService } from '../http-server/server.service'

@Injectable({
  providedIn: 'root',
})
export class NewsService {
  constructor (
    private serverService: ServerService
  ) {}

  getAll() {
    return this.serverService.get('news/get-all').then((data) => data.data || []);
  }
}
