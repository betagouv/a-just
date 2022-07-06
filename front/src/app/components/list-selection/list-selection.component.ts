import { ElementRef, HostListener, ViewChild } from '@angular/core'
import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  OnChanges,
  SimpleChanges,
} from '@angular/core'
import { ItemInterface } from 'src/app/interfaces/item'

@Component({
  selector: 'aj-list-selection',
  templateUrl: './list-selection.component.html',
  styleUrls: ['./list-selection.component.scss'],
})
export class ListSelectionComponent implements OnInit, OnChanges {
  @ViewChild('selectArea') selectArea: ElementRef<HTMLElement> | null = null
  @Input() title: string = ''
  @Input() icon: string = ''
  @Input() list: ItemInterface[] = []
  @Input() value: string | number | null = null
  @Input() values: (string | number)[] = []
  @Input() multiple: boolean = false
  @Output() valueChanged: EventEmitter<string | number | null> =
    new EventEmitter<string | number | null>()
  @Output() valuesChanged: EventEmitter<(string | number)[]> = new EventEmitter<
    (string | number)[]
  >()
  @Output() onOpen: EventEmitter<string> = new EventEmitter<string>()
  itemsSelected: ItemInterface[] = []
  onOpenDropdown: boolean = false
  maxHeightDropdown: number | null = null
  labelPreview: string = ''

  @HostListener('document:click', ['$event'])
  onClick() {
    this.onOpenDropdown = false
  }

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes.value || changes.list || changes.values) {
      if (this.multiple === false) {
        const value = this.value
          ? this.list.find((l) => l.id === this.value) || null
          : null

        this.itemsSelected = value ? [value] : []
      } else {
        this.itemsSelected = this.list.reduce(
          (acc: ItemInterface[], cur: ItemInterface) => {
            if (this.values && this.values.indexOf(cur.id) !== -1) {
              acc.push(cur)
            }
            return acc
          },
          []
        )
      }

      this.labelPreview = this.itemsSelected.map(i => i.label).join(', ')
    }
  }

  onSelect(item: string | number) {
    this.onOpenDropdown = false
    this.value = item
    this.valueChanged.next(this.value)
  }

  onSelectMultiple(item: string | number) {
    const findIndex = this.values.findIndex((v) => v === item)
    if (findIndex === -1) {
      this.values.push(item)
    } else {
      this.values.splice(findIndex, 1)
    }
    this.valuesChanged.next(this.values)
  }

  onToggleDropdown() {
    this.onOpenDropdown = !this.onOpenDropdown
    this.maxHeightDropdown = null

    if (this.onOpenDropdown) {
      this.onOpen.emit('open')
    }

    setTimeout(() => {
      const domArea = this.selectArea?.nativeElement
      if (domArea) {
        const { bottom, height } = domArea.getBoundingClientRect()
        const windowHeight = window.innerHeight
        const margin = 16

        if (bottom > windowHeight - margin) {
          this.maxHeightDropdown = height - margin + windowHeight - bottom
        }
      }
    }, 10)
  }

  close() {
    this.onOpenDropdown = false
    this.maxHeightDropdown = null
  }

  onSelectAll() {
    if(this.values.length === this.list.length) {
      this.values = []
    } else {
      this.values = this.list.map(i => i.id)
    }
    this.valuesChanged.next(this.values)
  }
}
