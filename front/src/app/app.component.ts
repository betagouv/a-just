import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HumanResourceService } from './services/human-resource/human-resource.service';
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
    private userService: UserService
  ) {
    router.events.subscribe((val) => {
      if (this.userService.user.getValue() && this.dbReady === false) {
        this.dbReady = true;
        
        this.humanResourceService.initDatas();
      }
    });
  }
}
