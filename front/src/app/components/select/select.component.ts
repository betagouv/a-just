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
  @Input() subReferentiel: undefined | number[] = undefined;
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
    let valueFormated: number[] | string[] = [];
    // @ts-ignore
    valueFormated = this.subReferentiel
      ? this.subReferentiel
      : Array.isArray(valueFormated)
      ? this.value
      : [valueFormated];

    this.subReferentielData = [];
    this.realValue = valueFormated
      .map((val) => {
        const find = this.datas.find((d) => d.id === val);
        if (find && !this.subReferentiel) return find.value;
        else if (find && this.subReferentiel)
          return [find.childrens].map((s) =>
            s
              ?.map((t) => {
                this.subReferentielData.push(t);
                this.subReferentiel?.push(t.id);
                return t.value;
              })
              .join(', ')
          );
        else return this.value;
      })
      .join(', ');
  }

  onSelectedChanged(list: number[] | number) {
    if (typeof list === 'number') {
      this.value = [list];
    } else {
      this.value = list;
    }
    this.valueChange.emit(this.value);
    this.findRealValue();
  }
}
