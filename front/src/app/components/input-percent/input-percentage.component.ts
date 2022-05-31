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
            this.valueChange.emit({
                value: Math.round(
                    parseInt(
                        this.returnSomething(
                            this.valueForm.controls['percentage'].value
                        )
                    )
                ),
                percentage: this.valueForm.controls['percentage'].value,
            })
        })
    }

    ngOnInit(): void {}

    ngOnChanges(changes: SimpleChanges) {
        if (this.reset === true) {
            this.valueForm.controls['percentage'].setValue('')
            this.defaultValue = null
            this.reset = false
        }
        if (this.defaultValue !== null) {
            this.valueForm.controls['percentage'].setValue(this.defaultValue)
        }
    }

    returnSomething(x: any): string {
        return x
            ? String(
                  Math.round(
                      this.referenceValue -
                          ((-parseInt(x) * 1) / 100) * this.referenceValue
                  )
              )
            : ''
    }

    returnPercentage(value: string): number {
        return (
            (-(this.referenceValue - Math.round(parseInt(value))) /
                this.referenceValue) *
            100
        )
    }
}
