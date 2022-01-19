import { Subscription } from 'rxjs';
import {
  referentielMappingColor,
  referentielMappingName,
} from '../utils/referentiel';
import { environment } from '../../environments/environment'
import { fixDecimal } from '../utils/numbers';
import { getMonthString } from '../utils/dates';

export class MainClass {
  watcherList: Subscription[] = [];
  environment = environment;

  fixDecimal(n: number): number {
    return fixDecimal(n);
  }

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

  public referentielMappingName(name: string): string {
    return referentielMappingName(name);
  }

  public referentielMappingColor(name: string): string {
    return referentielMappingColor(name);
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

  public getMonthString(date: Date) {
    return getMonthString(date)
  }

  public getCategoryColor(label: string, opacity: number = 1) {
    switch(label) {
      case 'Magistrat': return `rgba(0, 0, 145, ${opacity})`;
      case 'Fonctionnaire': return `rgba(165, 88, 160, ${opacity})`;
    }

    return `rgba(239, 203, 58, ${opacity})`;
  }
}
