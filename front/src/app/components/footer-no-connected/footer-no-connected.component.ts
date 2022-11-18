import {
  Component,
} from '@angular/core'
import { MainClass } from 'src/app/libs/main-class';

@Component({
  selector: 'aj-footer-no-connected',
  templateUrl: './footer-no-connected.component.html',
  styleUrls: ['./footer-no-connected.component.scss'],
})
export class FooterNoConnectedComponent extends MainClass {
  constructor() {
    super()
  }
}
