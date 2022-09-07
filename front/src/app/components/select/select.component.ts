import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core'
import { MainClass } from 'src/app/libs/main-class'

export interface dataInterface {
  id: number
  value: string
  orignalValue?: string
  childrens?: childrenInterface[]
}

export interface childrenInterface {
  id: number
  value: string
  parentId?: number
}

@Component({
  selector: 'aj-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent extends MainClass implements OnChanges {
  @Input() title: string | null = null
  @Input() icon: string = 'expand_more'
  @Input() value: number | string | null | number[] | string[] = null
  @Input() datas: dataInterface[] = []
  @Input() multiple: boolean = true
  @Input() subList: number[] | null = null
  @Input() parent: number | string | null = null
  @Input() defaultRealValue: string = ''
  @Output() valueChange: EventEmitter<number[] | string[]> = new EventEmitter()
  subReferentielData: dataInterface[] = []
  realValue: string = ''

  constructor() {
    super()
  }

  ngOnChanges() {
    this.findRealValue()
  }

  findRealValue() {
    let find = !this.parent
      ? this.datas.find((d) => d.id === this.value)
      : this.datas.find((d) => d.id === this.parent)

    let tmpStr = ''

    if (find && !this.subList && typeof this.value === 'number') {
      this.datas.map((v) => {
        if (v.id === this.value) {
          tmpStr = tmpStr.concat(v.value, tmpStr)
        }
      })
      this.realValue = tmpStr
    } else if (
      find &&
      this.subList &&
      this.value &&
      Object.keys(this.value).length !== find.childrens?.length
    ) {
      this.subReferentielData = []
      this.value = this.subList
      ;[find.childrens].map((s) =>
        s?.map((t) => {
          this.subReferentielData.push(t)
          tmpStr = (this.value as number[]).includes(t.id as never)
            ? tmpStr.concat(t.value, ', ')
            : tmpStr
        })
      )
      this.realValue = tmpStr.slice(0, -2)
    } else if (
      find &&
      this.subList &&
      this.value &&
      Object.keys(this.value).length === find.childrens?.length
    ) {
      this.subReferentielData = []
      this.value = this.subList
      ;[find.childrens].map((s) =>
        s?.map((t) => this.subReferentielData.push(t))
      )
      this.realValue = 'Tous'
    } else if (Array.isArray(this.value) && this.value.length !== 0) {
      const arrayValues = Array.isArray(this.value) ? this.value : [this.value]
      this.realValue = ''
      this.datas.map((v) => {
        arrayValues.map((x) => {
          if (v.id === x) {
            tmpStr = tmpStr.concat(v.value, ', ')
            this.realValue = tmpStr.slice(0, -2)
          }
        })
      })
    } else {
        this.realValue = ''
    }
  }

  onSelectedChanged(list: number[] | number) {
    if (this.parent && Array.isArray(list)) {
      if (list.length === 0) this.value = this.subList = []
      else if (list.length === 1) this.value = list
      else if (list.length === 2 && this.subReferentielData.length !== 2)
        this.value = this.subList = list.filter(
          (v) => ![this.value as number[]][0].includes(v)
        )
      else if (list.length === this.subReferentielData.length) this.value = list
      else if (list.length === this.subReferentielData.length - 1)
        this.value = this.subList = [this.value as number[]][0].filter(
          (v) => !list.includes(v)
        )
    } else if (typeof list === 'number') this.value = [list]
    else this.value = list

    this.valueChange.emit(this.value as number[])
    this.findRealValue()
  }
}
