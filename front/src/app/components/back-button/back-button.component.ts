import { Location } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'aj-back-button',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './back-button.component.html',
  styleUrls: ['./back-button.component.scss'],
})
export class BackButtonComponent {
  _location = inject(Location);
  @Input() routerLink: any;
  @Input() fragment: any;
  @Input() text: string = 'Retour';

  onClick() {
    if (this.routerLink === 'back') {
      this._location.back();
    }
  }
}
