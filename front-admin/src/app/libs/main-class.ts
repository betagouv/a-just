import { Subscription } from 'rxjs';
import { USER_ROLE_ADMIN, USER_ROLE_SUPER_ADMIN } from '../constants/roles';

export class MainClass {
  watcherList: Subscription[] = [];
  USER_ROLE_ADMIN = USER_ROLE_ADMIN;
  USER_ROLE_SUPER_ADMIN = USER_ROLE_SUPER_ADMIN;

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

  public isNotIOS() {
    return !this.isOS();
  }

  public trackBy(index: number, item: any) {
    return item.id;
  }
}
