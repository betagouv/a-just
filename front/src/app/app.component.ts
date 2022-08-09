import { Component } from '@angular/core';
import { Router } from '@angular/router';
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
    private userService: UserService,
  ) {
    router.events.subscribe(() => {
      const user = this.userService.user.getValue();
      if (user && this.dbReady === false) {
        this.dbReady = true;

        this.userService.initDatas();
      }
    });    
  }
}
