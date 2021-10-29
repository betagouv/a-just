import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { MainClass } from 'src/app/libs/main-class';
import { HRCategoryService } from 'src/app/services/hr-category/hr-category.service';
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';

@Component({
  templateUrl: './human-resource.page.html',
  styleUrls: ['./human-resource.page.scss'],
})
export class HumanResourcePage extends MainClass implements OnInit, OnDestroy {
  categories: HRCategoryInterface[] = [];
  fonctions: HRFonctionInterface[] = [];
  currentHR: HumanResourceInterface | null = null;
  formEditHR = new FormGroup({
    etp: new FormControl(null, [Validators.required]),
    firstName: new FormControl(null, [Validators.required]),
    lastName: new FormControl(null, [Validators.required]),
    dateStart: new FormControl(null),
    dateEnd: new FormControl(null),
    note: new FormControl(null),
    fonction: new FormControl(null, [Validators.required]),
    category: new FormControl(null, [Validators.required]),
  });

  constructor(
    private humanResourceService: HumanResourceService,
    private route: ActivatedRoute,
    private router: Router,
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService
  ) {
    super();
  }

  ngOnInit() {
    this.watch(this.route.params.subscribe((params) => {
      if (params.id) {
        this.onLoad();
      }
    }));

    this.watch(this.humanResourceService.hr.subscribe(() => this.onLoad()));

    this.hrFonctionService.getAll().then(list => this.fonctions = list);
    this.hrCategoryService.getAll().then(list => this.categories = list);
  }

  ngOnDestroy() {
    this.watcherDestroy();
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
      this.formEditHR.get('category')?.setValue(findUser.category && findUser.category.id || null);
      this.formEditHR.get('fonction')?.setValue(findUser.fonction && findUser.fonction.id || null);
    } else {
      this.currentHR = null;
      this.formEditHR.reset();
    }
  }

  onEdit() {
    if (this.formEditHR.invalid) {
      alert("Vous devez saisir l'ensemble des champs !");
    } else if (this.currentHR) {
      const { etp, firstName, lastName, dateStart, dateEnd, note, category, fonction } = this.formEditHR.value;
      this.currentHR.etp = (etp || 0) / 100;
      this.currentHR.firstName = firstName;
      this.currentHR.lastName = lastName;
      this.currentHR.dateStart = dateStart;
      this.currentHR.dateEnd = dateEnd;
      this.currentHR.note = note;
      this.currentHR.category = this.categories.find(c => c.id === +category);
      this.currentHR.fonction = this.fonctions.find(f => f.id === +fonction);

      const allHuman = this.humanResourceService.hr.getValue();
      const findIndex = allHuman.findIndex(
        (h) => h.id === (this.currentHR && this.currentHR.id)
      );

      if (findIndex !== -1) {
        allHuman[findIndex] = { ...this.currentHR };
        this.humanResourceService.hr.next(allHuman);

        this.router.navigate(['/effectifs'])
      }
    }
  }

  onReset() {
    this.onLoad();
  }
}
