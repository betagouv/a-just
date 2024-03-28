import { Component, Input } from '@angular/core'

@Component({
  selector: 'aj-back-button',
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss'],
})
export class BackButtonComponent {
  @Input() routerLink: any;
  @Input() fragment: any; 
}
