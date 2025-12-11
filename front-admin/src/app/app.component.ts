import { Component, inject } from '@angular/core';
import { AppService } from './services/app/app.service';

import { RouterOutlet } from '@angular/router';
import { BigLoaderComponent } from './components/big-loader/big-loader.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BigLoaderComponent],
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
