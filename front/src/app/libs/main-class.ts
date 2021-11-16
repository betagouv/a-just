import { Subscription } from "rxjs";
import { referentielMappingColor, referentielMappingName } from "../utils/referentiel";

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

  public referentielMappingName (name: string): string {
    return referentielMappingName(name);
  }

  public referentielMappingColor (name: string): string {
    return referentielMappingColor(name);
  }
}