import { Subscription } from "rxjs";

export class MainClass {
  watcherList: Subscription[] = [];

  watch (sub: any) {
    this.watcherList.push(sub)
  }

  watcherDestroy () {
    this.watcherList.map((w) => {
      try {
        w.unsubscribe()
      } catch (err) {}
    })
  }
}