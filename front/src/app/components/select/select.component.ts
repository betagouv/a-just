import { Component, Input, OnDestroy, OnChanges, Output, EventEmitter } from '@angular/core';
import { MainClass } from 'src/app/libs/main-class';

export interface dataInterface {
  id: number;
  value: string;
}

@Component({
  selector: 'aj-select',
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
})
export class SelectComponent extends MainClass implements OnChanges, OnDestroy {
  @Input() title: string | null = null;
  @Input() icon: string = 'expand_more';
  @Input() value: number | string | null | number[] | string[] = null;
  @Input() datas: dataInterface[] = [];
  @Output() valueChange: EventEmitter<number[] | string[]> = new EventEmitter();
  realValue: string = '';

  constructor() {
    super();
  }

  ngOnChanges() {
    this.findRealValue();
  }

  ngOnDestroy() {
    this.watcherDestroy();
  }

  findRealValue() {
    let valueFormated: number[] | string[] = [];
    if(Array.isArray(valueFormated)) {
      // @ts-ignore
      valueFormated = this.value;
    } else {
      valueFormated = [valueFormated];
    }

    this.realValue = valueFormated.map(val => {
      const find = this.datas.find((d) => d.id === val);
      if (find) {
        return find.value;
      }
        
      return this.value;
    }).join(', ');    
  }

  onSelectedChanged(list: number[]) {
    this.value = list;
    this.valueChange.emit(this.value);
    this.findRealValue();
  }
}
