import { Injectable } from '@angular/core';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class HRCategoryService {
  categories: HRCategoryInterface[] = [];

  constructor(private serverService: ServerService) {}

  getAll(): Promise<HRCategoryInterface[]> {
    if(this.categories.length) {
      return new Promise((resolve) => {
        resolve(this.categories);
      });
    }

    return this.serverService
      .get('hr-categories/get-all')
      .then((r) => r.data || [])
      .then(list => {
        this.categories = list;
        return list;
      })
  }
}
