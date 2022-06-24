import { Component, OnInit } from '@angular/core'

@Component({
  selector: 'aj-radio-button',
  templateUrl: './radio-button.component.html',
  styleUrls: ['./radio-button.component.scss'],
})
export class RadioButtonComponent implements OnInit {
  o = {
    label: 'Cheap',
    checked: true,
  }

  constructor() {}

  ngOnInit(): void {}

  clicked() {
    this.o.checked = !this.o.checked
    console.log(this.o)
  }
}
