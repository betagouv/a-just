import { Component } from '@angular/core'
import { Router } from '@angular/router'
import { environment } from 'src/environments/environment'
import { ContentieuxOptionsService } from './services/contentieux-options/contentieux-options.service'
import { UserService } from './services/user/user.service'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  dbReady: boolean = false

  constructor(
    router: Router,
    private userService: UserService,
    private contentieuxOptionsService: ContentieuxOptionsService
  ) {
    router.events.subscribe(() => {
      const user = this.userService.user.getValue()
      if (user && this.dbReady === false) {
        this.dbReady = true

        this.userService.initDatas()
        this.contentieuxOptionsService.initDatas()
      }
    })
  }
}
