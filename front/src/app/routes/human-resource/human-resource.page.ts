import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { sumBy } from 'lodash';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
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
  contentieuxReferentiel: ContentieuReferentielInterface[] = [];
  currentHR: HumanResourceInterface | null = null;
  activities: RHActivityInterface[] = [];
  formEditHR = new FormGroup({
    etp: new FormControl(null, [Validators.required]),
    posad: new FormControl(null, [Validators.required]),
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
    this.watch(
      this.route.params.subscribe((params) => {
        if (params.id) {
          this.onLoad();
        }
      })
    );
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        (list) => (this.contentieuxReferentiel = list)
      )
    );
    this.watch(this.humanResourceService.hr.subscribe(() => this.onLoad()));
    this.hrFonctionService.getAll().then((list) => (this.fonctions = list));
    this.hrCategoryService.getAll().then((list) => (this.categories = list));
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
      this.formEditHR.get('posad')?.setValue((findUser.posad || 0) * 100);
      this.formEditHR.get('firstName')?.setValue(findUser.firstName || '');
      this.formEditHR.get('lastName')?.setValue(findUser.lastName || '');
      this.formEditHR.get('dateStart')?.setValue(findUser.dateStart || null);
      this.formEditHR.get('dateEnd')?.setValue(findUser.dateEnd || null);
      this.formEditHR.get('note')?.setValue(findUser.note || '');
      this.formEditHR
        .get('category')
        ?.setValue((findUser.category && findUser.category.id) || null);
      this.formEditHR
        .get('fonction')
        ?.setValue((findUser.fonction && findUser.fonction.id) || null);
      this.activities = JSON.parse(
        JSON.stringify((findUser.activities || []).filter((a) => a.percent))
      );
    } else {
      this.currentHR = null;
      this.formEditHR.reset();
    }
  }

  calculTotalTmpActivity(activities: RHActivityInterface[]) {
    const now = new Date();
    activities = (activities || []).filter((a: any) => {
      const dateStop = a.dateStop ? new Date(a.dateStop) : null;
      const dateStart = a.dateStart ? new Date(a.dateStart) : null;

      return (
        (dateStart === null && dateStop === null) ||
        (dateStart &&
          dateStart.getTime() <= now.getTime() &&
          dateStop === null) ||
        (dateStart === null &&
          dateStop &&
          dateStop.getTime() >= now.getTime()) ||
        (dateStart &&
          dateStart.getTime() <= now.getTime() &&
          dateStop &&
          dateStop.getTime() >= now.getTime())
      );
    });

    return sumBy(
      activities.filter((ca) => {
        return this.contentieuxReferentiel.find((r) => r.id === ca.referentielId)
          ? true
          : false;
      }),
      'percent'
    );
  }

  onEdit() {
    if (this.formEditHR.invalid) {
      alert("Vous devez saisir l'ensemble des champs !");
    } else if (this.currentHR) {
      const {
        etp,
        firstName,
        lastName,
        dateStart,
        dateEnd,
        note,
        category,
        fonction,
        posad,
      } = this.formEditHR.value;
      this.currentHR.etp = (etp || 0) / 100;
      this.currentHR.posad = (posad || 0) / 100;
      this.currentHR.firstName = firstName;
      this.currentHR.lastName = lastName;
      this.currentHR.dateStart = dateStart;
      this.currentHR.dateEnd = dateEnd;
      this.currentHR.note = note;
      this.currentHR.category = this.categories.find((c) => c.id === +category) || { id: -1, label: 'not found'};
      this.currentHR.fonction = this.fonctions.find((f) => f.id === +fonction);
      this.currentHR.activities = (this.activities || []).map((a) => ({
        ...a,
        referentielId: +(a.referentielId || 0),
        dateStart: a.dateStart ? new Date(a.dateStart) : undefined,
        dateStop: a.dateStop ? new Date(a.dateStop) : undefined,
      }));

      const totalAffected = this.calculTotalTmpActivity(
        this.currentHR.activities
      );
      if (totalAffected > 100) {
        alert(
          `Attention, avec les autres affectations, vous avez atteint un total de ${totalAffected}% de ventilation ! Vous ne pouvez passer au dessus de 100%.`
        );
        return;
      }

      const allHuman = this.humanResourceService.hr.getValue();
      const findIndex = allHuman.findIndex(
        (h) => h.id === (this.currentHR && this.currentHR.id)
      );

      if (findIndex !== -1) {
        allHuman[findIndex] = { ...this.currentHR };
        this.humanResourceService.hr.next(allHuman);
        this.humanResourceService.hrIsModify.next(true);

        this.router.navigate(['/ventilations']);
      }
    }
  }

  onReset() {
    this.onLoad();
  }

  onRemoveRH() {
    if (
      this.currentHR &&
      this.humanResourceService.removeHrById(this.currentHR.id)
    ) {
      this.router.navigate(['/ventilations']);
    }
  }
}
