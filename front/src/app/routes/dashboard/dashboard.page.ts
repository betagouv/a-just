import { Component, OnInit } from "@angular/core";
import { HumanResourceService } from "src/app/services/human-resource/human-resource.service";

@Component({
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"],
})
export class DashboardPage implements OnInit {
  constructor(private humanResourceService: HumanResourceService) {}

  ngOnInit() {
    console.log(this.humanResourceService.hr.getValue())
  }
}
