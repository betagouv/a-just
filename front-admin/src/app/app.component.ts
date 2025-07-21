import { Component, inject } from '@angular/core';
import { AppService } from './services/app/app.service';

import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  appService = inject(AppService);
  isLoading: boolean = false;

  constructor() {
    this.appService.isLoading.subscribe((s) => (this.isLoading = s));
  }
}
