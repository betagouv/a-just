import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HumanResourceService } from './services/human-resource/human-resource.service';
import { IndicatorService } from './services/indicator/indicator.service';
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
    private indicatorService: IndicatorService,
    private userService: UserService
  ) {
    router.events.subscribe((val) => {
      if (this.userService.user.getValue() && this.dbReady === false) {
        this.dbReady = true;
        
        this.humanResourceService.initDatas();
        this.indicatorService.initDatas();
      }
    });
  }
}
