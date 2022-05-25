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
export class TimeSelectorComponent implements OnChanges {
    @Input() value: number = 0
    @Output() valueChange = new EventEmitter()
    toChange: boolean = true

    timeForm = new FormGroup({
        hour: new FormControl(''),
        minute: new FormControl(''),
    })

    constructor() {
        this.timeForm.controls.minute.valueChanges.subscribe((value) => {
            if (parseInt(value) <= 59 && this.toChange === true)
                this.onChangeHour(this.getFormString())
            else if (parseInt(value) > 59 && this.toChange === true) {
                this.toChange = false
                this.timeForm.controls['minute'].setValue(59)
                this.onChangeHour(this.getFormString('59'))
            } else this.toChange = true
        })

        this.timeForm.controls.hour.valueChanges.subscribe(() => {
            if (this.toChange === true) this.onChangeHour(this.getFormString())
        })
    }

    ngOnChanges() {
        if (this.toChange === true) {
            this.toChange = false
            this.timeForm.controls['hour'].setValue(
                String(this.value).split('.')[0]
            )
            this.toChange = false
            this.timeForm.controls['minute'].setValue(
                this.decimalToStringDate(this.value).split(':')[1] || '00'
            )
        } else this.toChange = true
    }

    getFormString(minute?: string) {
        return ''.concat(
            this.timeForm.controls['hour'].value,
            ':',
            minute ? minute : this.timeForm.controls['minute'].value
        )
    }

    decimalToStringDate(decimal: number) {
        if (decimal != null) {
            const n = new Date(0, 0)
            n.setMinutes(Math.ceil(+decimal * 60))
            return n.toTimeString().slice(0, 5)
        }
        return '0'
    }

    onChangeHour(str: string) {
        this.value = this.timeToDecimal(str)
        this.valueChange.emit(this.timeToDecimal(str))
    }

    timeToDecimal(time: string) {
        var arr = time.split(':')
        var dec = (parseInt(arr[1], 10) / 6) * 10

        return parseFloat(
            (parseInt(arr[0], 10) || 0) + '.' + (dec < 10 ? '0' : '') + dec
        )
    }
}
