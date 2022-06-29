import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core'
import { ItemInterface } from 'src/app/interfaces/item'

@Component({
  selector: 'aj-list-selection',
  templateUrl: './list-selection.component.html',
  styleUrls: ['./list-selection.component.scss'],
})
export class ListSelectionComponent implements OnInit, OnChanges {
  @Input() title: string = ''
  @Input() icon: string = ''
  @Input() list: ItemInterface[] = []
  @Input() value: string | null = null
  @Output() itemChanged: EventEmitter<string | null> = new EventEmitter<
    string | null
  >()
  itemSelected: ItemInterface | null = null

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if(changes.value || changes.list) {
      this.itemSelected = this.value ? (this.list.find(l => l.id === this.value) || null) : null
    }
  }

  onSelect(item: string | null) {
    this.value = item
    this.itemChanged.next(item)
  }
}
