import { Component, OnInit } from "@angular/core";
import { ContentieuReferentielInterface } from "src/app/interfaces/contentieu-referentiel";
import { HumanResourceInterface } from "src/app/interfaces/human-resource-interface";
import { HumanResourceService } from "src/app/services/human-resource/human-resource.service";

@Component({
  templateUrl: "./workforce.page.html",
  styleUrls: ["./workforce.page.scss"],
})
export class WorkforcePage implements OnInit {
  humanResources: HumanResourceInterface[] = []
  referentiel: ContentieuReferentielInterface[] = []

  constructor(private humanResourceService: HumanResourceService) {}

  ngOnInit() {
    this.humanResourceService.getCurrentHR().then((result) => {
      this.humanResources = result.hr;
      this.referentiel = result.contentieuxReferentiel
    })
  }
}
