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

  public referentielMappingName (name: string): string {
    switch(name) {
      case 'Soutien': return 'Sout.';
      case 'Indisponibilité': return 'Indisp.';
      case 'Siège Pénal': return 'Pénal';
      case 'Contentieux JAF': return 'JAF';
      case 'Contentieux Social': return 'Social';
      case 'Contentieux de la Protection': return 'JCP';
      case 'Juges des Enfants': return 'JE';
      case 'Civil Non Spécialisé': return 'JNS';
      case 'Juges d\'Instruction': return 'JI';
    }

    return name
  }
}