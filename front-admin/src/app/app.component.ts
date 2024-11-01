import { Component } from '@angular/core';
import { AppService } from './services/app/app.service';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  isLoading: boolean = false;

  constructor(private appService: AppService) {
    this.appService.isLoading.subscribe((s) => (this.isLoading = s));
  }
}
