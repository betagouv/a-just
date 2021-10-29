import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';

@Component({
  templateUrl: './human-resource.page.html',
  styleUrls: ['./human-resource.page.scss'],
})
export class HumanResourcePage implements OnInit {
  currentHR: HumanResourceInterface | null = null;
  formEditHR = new FormGroup({
    etp: new FormControl(null, [Validators.required]),
    firstName: new FormControl(null, [Validators.required]),
    lastName: new FormControl(null, [Validators.required]),
    dateStart: new FormControl(null),
    dateEnd: new FormControl(null),
    note: new FormControl(null),
  });

  constructor(
    private humanResourceService: HumanResourceService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      if (params.id) {
        this.onLoad();
      }
    });

    this.humanResourceService.hr.subscribe(() => this.onLoad());
  }

  onLoad() {
    const id = +this.route.snapshot.params.id;
    const allHuman = this.humanResourceService.hr.getValue();

    const findUser = allHuman.find((h) => h.id === id);
    if (findUser) {
      this.currentHR = findUser;
      this.formEditHR.get('etp')?.setValue((findUser.etp || 0) * 100);
      this.formEditHR.get('firstName')?.setValue(findUser.firstName || '');
      this.formEditHR.get('lastName')?.setValue(findUser.lastName || '');
      this.formEditHR.get('dateStart')?.setValue(findUser.dateStart || null);
      this.formEditHR.get('dateEnd')?.setValue(findUser.dateEnd || null);
      this.formEditHR.get('note')?.setValue(findUser.note || '');
    } else {
      this.currentHR = null;
      this.formEditHR.reset();
    }
  }

  onEdit() {
    if (this.formEditHR.invalid) {
      alert("Vous devez saisir l'ensemble des champs !");
    } else if (this.currentHR) {
      const { etp, firstName, lastName, dateStart, dateEnd, note } = this.formEditHR.value;
      this.currentHR.etp = (etp || 0) / 100;
      this.currentHR.firstName = firstName;
      this.currentHR.lastName = lastName;
      this.currentHR.dateStart = dateStart;
      this.currentHR.dateEnd = dateEnd;
      this.currentHR.note = note;

      const allHuman = this.humanResourceService.hr.getValue();
      const findIndex = allHuman.findIndex(
        (h) => h.id === (this.currentHR && this.currentHR.id)
      );

      if (findIndex !== -1) {
        allHuman[findIndex] = { ...this.currentHR };
        this.humanResourceService.hr.next(allHuman);
      }
    }
  }

  onReset() {
    this.onLoad();
  }
}
