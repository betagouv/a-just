import { Component } from '@angular/core';
import { AppService } from './services/app/app.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  isLoading: boolean = false;

  constructor(private appService: AppService) {
    this.appService.isLoading.subscribe((s) => (this.isLoading = s));
  }
}
