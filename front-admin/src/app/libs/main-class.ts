import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment'

export class MainClass {
  watcherList: Subscription[] = [];
  environment = environment;

  watch(sub: any) {
    this.watcherList.push(sub);
  }

  watcherDestroy() {
    this.watcherList.map((w) => {
      try {
        w.unsubscribe();
      } catch (err) {}
    });
  }

  public isOS() {
    return navigator.userAgent.indexOf('AppleWebKit') !== -1;
  }

  public isNotOS() {
    return !this.isOS();
  }

  public trackBy(index: number, item: any) {
    return item.id;
  }
}
