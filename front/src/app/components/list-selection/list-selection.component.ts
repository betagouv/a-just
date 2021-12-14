import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ItemInterface } from 'src/app/interfaces/item';

@Component({
  selector: 'aj-list-selection',
  templateUrl: './list-selection.component.html',
  styleUrls: ['./list-selection.component.scss'],
})
export class ListSelectionComponent implements OnInit {
  @Input() title: string = '';
  @Input() list: ItemInterface[] = [];
  @Input() item: string | null = null;
  @Output() itemChanged: EventEmitter<string | null> = new EventEmitter<string | null>()

  constructor() {}

  ngOnInit() {}

  onSelect (item: string | null) {
    this.item = item;
    this.itemChanged.next(item);
  }
}
