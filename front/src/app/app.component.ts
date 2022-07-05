import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ContentieuxOptionsService } from './services/contentieux-options/contentieux-options.service';
import { HumanResourceService } from './services/human-resource/human-resource.service';
import { ReferentielService } from './services/referentiel/referentiel.service';
import { UserService } from './services/user/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  dbReady: boolean = false;

  constructor(
    router: Router,
    private humanResourceService: HumanResourceService,
    private userService: UserService,
    private referentielService: ReferentielService,
    private contentieuxOptionsService: ContentieuxOptionsService,
  ) {
    router.events.subscribe(() => {
      const user = this.userService.user.getValue();
      if (user && this.dbReady === false) {
        this.dbReady = true;

        this.referentielService.initDatas();
    
        if(user.access && user.access.indexOf(2) !== -1) {
          this.humanResourceService.initDatas();
        }
    
        if(user.access && user.access.indexOf(4) !== -1) {
          this.contentieuxOptionsService.initDatas();  
        }
      }
    });    
  }
}
