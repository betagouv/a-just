import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'

@Component({
  selector: 'app-time-selector',
  templateUrl: './time-selector.component.html',
  styleUrls: ['./time-selector.component.scss'],
})
export class TimeSelectorComponent {
  @Input() value: number = 0
  @Input() disabled: boolean = false
  @Input() changed: boolean = false
  @Output() valueChange = new EventEmitter()
  regex = '^([1-9]?[0-9]{1}|^100):[0-5][0-9]$' //'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
  regexObj = new RegExp(this.regex)
  timeForm = new FormGroup({
    time: new FormControl(''),
  })

  constructor() {
    this.timeForm.controls.time.valueChanges.subscribe((value) => {
      if (value !== null && this.regexObj.test(value)) {
        this.changed = true
        this.onChangeHour(value)
      }
    })
  }

  onChangeHour(str: string) {
    this.value = this.timeToDecimal(str)
    this.valueChange.emit(this.timeToDecimal(str))
  }

  timeToDecimal(time: string) {
    var arr = time.split(':')
    var dec = (parseInt(arr[1], 10) / 6) * 10

    let fulldec = String(dec).split('.').join('')

    return parseFloat(
      (parseInt(arr[0], 10) || 0) + '.' + (dec < 10 ? '0' : '') + fulldec
    )
  }

  getImg() {
    return this.changed
      ? '/assets/icons/time-line-blue.svg'
      : '/assets/icons/time-line.svg'
  }
}
