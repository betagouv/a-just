import { Component } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";

@Component({
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"],
})
export class DashboardPage {
  form = new FormGroup({
    speed: new FormControl(10),
    amplitude: new FormControl(50),
  });

  constructor() {}

  changeInputValue(dom: any, delta: number) {
    dom.value = +(dom.value) + delta
  }
}
