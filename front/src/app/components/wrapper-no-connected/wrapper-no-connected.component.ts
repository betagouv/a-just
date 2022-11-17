import {
  Component,
  Input,
} from '@angular/core'

@Component({
  selector: 'aj-wrapper-no-connected',
  templateUrl: './wrapper-no-connected.component.html',
  styleUrls: ['./wrapper-no-connected.component.scss'],
})
export class WrapperNoConnectedComponent {
  @Input() title: string = ''
}
