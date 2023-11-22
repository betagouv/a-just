import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  /**
   * Observable du loadeur générale
   */
  isLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  setIsLoading(status: boolean) {
    this.isLoading.next(status);
  }
}
