import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'

@Component({
  selector: 'app-time-selector',
  templateUrl: './time-selector.component.html',
  styleUrls: ['./time-selector.component.scss'],
})
export class TimeSelectorComponent implements OnChanges {
  @Input() value: number = 0
  @Input() disabled: boolean = false
  @Input() changed: boolean = false
  @Input() outsideChange: boolean | undefined = false
  @Input() defaultValue: number = 0
  @Input() defaultValueFonc: number = 0
  @Input() category: string = ''
  @Output() valueChange = new EventEmitter()
  regex = '^([0-9]?[0-9]{1}|^100):[0-5][0-9]$' //'^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
  regexObj = new RegExp(this.regex)
  firstChange = true
  insideChange = false
  timeForm = new FormGroup({
    time: new FormControl(''),
  })

  constructor(private contentieuxOptionsService: ContentieuxOptionsService) {
    this.contentieuxOptionsService.initValue.subscribe((value) => {
      if (value === true) {
        this.changed = false
        this.firstChange = true
      }
    })
  }

  ngOnChanges() {
    this.timeForm.controls['time'].setValue(
      this.decimalToStringDate(this.value) || ''
    )
    if (this.outsideChange === true) this.changed = true
    this.firstChange = false
  }

  updateVal(event: any) {
    const value = event.target.value
    if (value !== null && this.regexObj.test(value)) {
      if (this.firstChange === true) {
        if (this.category === 'MAGISTRATS') this.value = this.defaultValue
        else this.value = this.defaultValueFonc

        this.changed = false
        this.firstChange = false
      } else {
        this.onChangeHour(value)
        this.changed = true
      }
    }
  }
  decimalToStringDate(decimal: number) {
    if (decimal != null) {
      const n = new Date(0, 0)
      n.setMinutes(Math.round(+decimal * 60))
      return n.toTimeString().slice(0, 5)
    }
    return ''
  }

  onChangeHour(str: string) {
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

  blur(event: any) {
    event.target.blur()
  }
}
