import { Injectable } from '@angular/core';
import { ServerService } from '../http-server/server.service';

@Injectable({
  providedIn: 'root',
})
export class IndicatorService {
  constructor(private serverService: ServerService) {}

  initDatas() {
  }
}
