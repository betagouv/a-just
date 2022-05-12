import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';

export interface dataInterface {
  id: number;
  value: string;
  childrens?: childrenInterface[];
}

export interface childrenInterface {
  id: number;
  value: string;
  parentId?: number;
}

@Component({
  selector: 'aj-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent extends MainClass implements OnChanges {
  @Input() title: string | null = null;
  @Input() icon: string = 'expand_more';
  @Input() value: number | string | null | number[] | string[] = null;
  @Input() datas: dataInterface[] = [];
  @Input() multiple: boolean = true;
  @Input() subReferentiel: number[] | null = null;
  @Input() parent: number | null = null;
  @Input() defaultRealValue: string = '';
  @Output() valueChange: EventEmitter<number[] | string[]> = new EventEmitter();
  subReferentielData: dataInterface[] = [];
  realValue: string = '';

  constructor() {
    super();
  }

  ngOnChanges() {
    this.findRealValue();
  }

  findRealValue() {
    const find = !this.parent
      ? this.datas.find((d) => d.id === this.value)
      : this.datas.find((d) => d.id === this.parent);

    if (find && !this.subReferentiel) this.realValue = find.value;
    else if (
      find &&
      this.subReferentiel &&
      this.value &&
      Object.keys(this.value).length !== find.childrens?.length
    ) {
      this.subReferentielData = [];
      this.value = this.subReferentiel;

      let tmpRealValue = '';
      [find.childrens].map((s) =>
        s?.map((t) => {
          this.subReferentielData.push(t);
          tmpRealValue = (this.value as number[]).includes(t.id as never)
            ? tmpRealValue.concat(t.value, ', ')
            : tmpRealValue;
        })
      );
      this.realValue = tmpRealValue.slice(0, -2);
    } else if (
      find &&
      this.subReferentiel &&
      this.value &&
      Object.keys(this.value).length === find.childrens?.length
    ) {
      this.subReferentielData = [];
      this.value = this.subReferentiel;
      [find.childrens].map((s) =>
        s?.map((t) => this.subReferentielData.push(t))
      );
      this.realValue = 'Tous';
    } else this.realValue = '';
  }

  onSelectedChanged(list: number[] | number) {
    if (this.parent && Array.isArray(list)) {
      if (list.length === 0) {
        this.value = [];
        this.subReferentiel = [];
      } else if (list.length === 1) {
        this.value = list;
      } else if (list.length === 2) {
        const test = list.filter(
          (v) => ![this.value as number[]][0].includes(v)
        );
        this.value = test;
        this.subReferentiel = test;
      } else if (list.length === this.subReferentielData.length) {
        this.value = list;
      } else if (list.length === this.subReferentielData.length - 1) {
        const test = [this.value as number[]][0].filter(
          (v) => !list.includes(v)
        );
        this.value = test;
        this.subReferentiel = test;
      }
    } else if (typeof list === 'number') {
      this.value = [list];
    } else {
      this.value = list;
    }
    //@ts-ignore
    this.valueChange.emit(this.value);
    this.findRealValue();
  }
}
