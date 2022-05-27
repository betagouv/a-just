import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'

@Component({
    selector: 'aj-input-percentage',
    templateUrl: './input-percentage.component.html',
    styleUrls: ['./input-percentage.component.scss'],
})
export class InputPercentageComponent implements OnInit, OnChanges {
    @Input() referenceValue: number = 0
    @Input() defaultValue: string | null = null
    @Input() reset: boolean = false
    @Output() valueChange = new EventEmitter()

    valueForm = new FormGroup({
        percentage: new FormControl(''),
    })
    constructor() {
        this.valueForm.controls.percentage.valueChanges.subscribe((value) => {
            console.log(value)

            this.valueChange.emit(
                this.returnSomething(
                    this.valueForm.controls['percentage'].value
                )
            )
        })
    }

    ngOnInit(): void {}

    ngOnChanges(changes: SimpleChanges) {
        console.log('onchange', this.reset)
        if (this.reset === true) {
            this.valueForm.controls['percentage'].setValue('')
            this.defaultValue = null
            this.reset = false
        }
        if (this.defaultValue !== null) {
            this.valueForm.controls['percentage'].setValue(
                this.returnPercentage(this.defaultValue)
            )
        }
    }
    print(x: any) {
        console.log(x)
    }

    returnSomething(x: any): string {
        return x
            ? String(
                  this.referenceValue -
                      ((-parseInt(x) * 1) / 100) * this.referenceValue
              )
            : ''
    }

    returnPercentage(value: string): number {
        return (
            (-(this.referenceValue - parseInt(value)) / this.referenceValue) *
            100
        )
    }
}
