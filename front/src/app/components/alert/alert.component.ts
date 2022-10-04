import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core'

@Component({
  selector: 'aj-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
})
export class AlertComponent implements OnChanges {
  @Input() alertMessage: string = ''
  @Input() delay: number | undefined
  @Output() onClose: EventEmitter<any> = new EventEmitter()
  timeout: any

  ngOnChanges() {
    if (this.delay) {
      if (this.timeout) {
        clearTimeout(this.timeout)
        this.timeout = undefined
      }

      this.timeout = setTimeout(() => {
        this.onClose.emit()
        this.timeout = undefined
      }, this.delay * 1000)
    }
  }
}
