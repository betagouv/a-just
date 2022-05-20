import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core'

@Component({
    selector: 'app-time-selector',
    templateUrl: './time-selector.component.html',
    styleUrls: ['./time-selector.component.scss'],
})
export class TimeSelectorComponent implements OnInit {
    @Input() value: number = 0
    @Output() valueChange = new EventEmitter()

    constructor() {}

    ngOnInit(): void {}

    decimalToStringDate(decimal: number) {
        if (decimal != null) {
            const n = new Date(0, 0)
            n.setMinutes(Math.ceil(+decimal * 60))
            return n.toTimeString().slice(0, 5)
        }
        return ''
    }

    onChangeHour(event: any) {
        this.value = this.timeToDecimal(event)
        this.valueChange.emit(this.timeToDecimal(event))
    }

    timeToDecimal(t: string) {
        var arr = t.split(':')
        var dec = (parseInt(arr[1], 10) / 6) * 10

        return parseFloat(
            parseInt(arr[0], 10) + '.' + (dec < 10 ? '0' : '') + dec
        )
    }
}
