import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { maxBy, minBy, sumBy } from 'lodash';
import { ActionsInterface } from 'src/app/components/popup/popup.component';
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel';
import { HRCategoryInterface } from 'src/app/interfaces/hr-category';
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction';
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface';
import { RHActivityInterface } from 'src/app/interfaces/rh-activity';
import { MainClass } from 'src/app/libs/main-class';
import { HRCategoryService } from 'src/app/services/hr-category/hr-category.service';
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service';
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service';
import { today } from 'src/app/utils/dates';
import { fixDecimal } from 'src/app/utils/numbers';

@Component({
  selector: 'add-ventilation',
  templateUrl: './add-ventilation.component.html',
  styleUrls: ['./add-ventilation.component.scss'],
})
export class AddVentilationComponent extends MainClass implements OnChanges {
  @Input() human: HumanResourceInterface | null = null;
  @Input() indisponibilities: RHActivityInterface[] = [];
  @Input() activities: RHActivityInterface[] = [];
  @Input() lastDateStart: Date | null = null;
  @Output() ventilationChange = new EventEmitter();
  indisponibilitiesVisibles: RHActivityInterface[] = [];
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = [];
  showNewVentilation: boolean = false;
  categories: HRCategoryInterface[] = [];
  fonctions: HRFonctionInterface[] = [];
  updateIndisponiblity: RHActivityInterface | null = null;
  updatedReferentiels: ContentieuReferentielInterface[] = [];
  indisponibilityError: string | null = null;
  etp: number = 1;
  form = new FormGroup({
    activitiesStartDate: new FormControl(new Date(), [Validators.required]),
    etp: new FormControl(null, [Validators.required]),
    firstName: new FormControl(null, [Validators.required]),
    lastName: new FormControl(null, [Validators.required]),
    dateStart: new FormControl(null),
    dateEnd: new FormControl(null),
    fonctionId: new FormControl(null, [Validators.required]),
    categoryId: new FormControl(null, [Validators.required]),
  });

  constructor(
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService,
    private humanResourceService: HumanResourceService
  ) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.hrFonctionService.getAll().then(() => this.loadCategories())
    );
    this.watch(
      this.hrCategoryService.getAll().then((list) => (this.categories = list))
    );
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        () =>
          (this.allIndisponibilityReferentiel =
            this.humanResourceService.allIndisponibilityReferentiel)
      )
    );
  }

  ngOnChanges() {
    this.onStart();
  }

  onStart() {
    const situation = this.humanResourceService.findSituation(this.human);

    this.etp = (situation && situation.etp) || 0;

    this.form.get('activitiesStartDate')?.setValue(this.lastDateStart ? new Date(this.lastDateStart) : new Date());
    this.form.get('etp')?.setValue(((situation && situation.etp) || 0) * 100);
    this.form
      .get('firstName')
      ?.setValue((this.human && this.human.firstName) || '');
    this.form
      .get('lastName')
      ?.setValue((this.human && this.human.lastName) || '');
    this.form
      .get('dateStart')
      ?.setValue((this.human && this.human.dateStart) || null);
    this.form
      .get('dateEnd')
      ?.setValue((this.human && this.human.dateEnd) || null);
    this.form
      .get('categoryId')
      ?.setValue((situation && situation.category && situation.category.id) || null);
    this.form
      .get('fonctionId')
      ?.setValue(
        (situation && situation.fonction && situation.fonction.id) || null
      );

    this.watch(
      this.form
        .get('categoryId')
        ?.valueChanges.subscribe(() => this.loadCategories())
    );

    this.loadCategories();
    this.controlIndisponibilities();
  }

  ngOnDestroy(): void {
    this.watcherDestroy();
  }

  async loadCategories() {
    if (this.form.value) {
      this.fonctions = (await this.hrFonctionService.getAll()).filter(
        (c) => c.categoryId == this.form.value.categoryId
      );
    }
  }

  onCancel() {
    this.form.reset();
    this.showNewVentilation = false;
    const findElement = document.getElementById('content');
    if (findElement) {
      findElement.scrollTo({
        behavior: 'smooth',
        top: 0,
      });
    }
  }

  controlIndisponibilities() {
    const indispos = this.indisponibilities;
    const max = maxBy(
      indispos.filter((a) => a.dateStop),
      function (o) {
        const dateStop = new Date(o.dateStop ? o.dateStop : '');
        return dateStop.getTime();
      }
    );
    let maxDate = max && max.dateStop ? today(max.dateStop) : new Date(today());
    const min = minBy(
      indispos.filter((a) => a.dateStart),
      function (o) {
        const dateStart = new Date(o.dateStart ? o.dateStart : '');
        return dateStart.getTime();
      }
    );
    const minDate =
      min && min.dateStart ? today(min.dateStart) : new Date(today());

    const currentDate = new Date(maxDate);
    let idOfActivities: number[] = [];
    let errorsList = [];
    while (currentDate.getTime() >= minDate.getTime()) {
      const findedActivities = this.humanResourceService.filterActivitiesByDate(
        indispos,
        currentDate
      );

      if (
        JSON.stringify(idOfActivities) !==
        JSON.stringify(findedActivities.map((f) => f.id))
      ) {
        idOfActivities = findedActivities.map((f) => f.id);

        const totalPercent = sumBy(findedActivities, 'percent');
        if (totalPercent > 100) {
          errorsList.push({
            date: new Date(currentDate),
            percent: totalPercent,
          });
        }
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }

    this.indisponibilityError = errorsList.length
      ? errorsList
          .map(
            (r) =>
              `Le ${(r.date.getDate() + '').padStart(
                2,
                '0'
              )} ${this.getShortMonthString(
                r.date
              )} ${r.date.getFullYear()} vous êtes à ${
                r.percent
              }% d'indisponibilité.`
          )
          .join(', ')
      : null;

    this.indisponibilitiesVisibles = indispos;
  }

  async onSave() {
    if (this.indisponibilityError) {
      alert(this.indisponibilityError);
      return;
    }

    const totalAffected = fixDecimal(
      sumBy(this.updatedReferentiels, 'percent')
    );
    if (totalAffected > 100) {
      alert(
        `Attention, avec les autres affectations, vous avez atteint un total de ${totalAffected}% de ventilation ! Vous ne pouvez passer au dessus de 100%.`
      );
      return;
    }

    let { activitiesStartDate, dateEnd } = this.form.value;
    if(dateEnd && activitiesStartDate) {
      activitiesStartDate = new Date(activitiesStartDate);
      dateEnd = new Date(dateEnd);

      if(activitiesStartDate.getTime() >= dateEnd.getTime()) {
        alert('Vous ne pouvez pas saisir une ventilation supérieure à la date de sortie !');
        return;
      }
    }

    if (this.human) {
      if (
        await this.humanResourceService.pushHRUpdate(
          this.human?.id,
          this.form.value,
          this.updatedReferentiels,
          this.indisponibilities
        )
      ) {
        this.ventilationChange.emit(true);
        this.onCancel();
      }
    }
  }

  onAddIndispiniblity() {
    this.updateIndisponiblity = {
      id: this.indisponibilities.length * -1 - 1,
      percent: 0,
      referentielId: this.allIndisponibilityReferentiel[0].id,
      dateStart: new Date(),
    };
  }

  onEditIndisponibility(action: ActionsInterface) {
    switch (action.id) {
      case 'close':
        {
          this.updateIndisponiblity = null;
        }
        break;
      case 'modify':
        {
          if (this.updateIndisponiblity) {
            this.updateIndisponiblity.referentielId =
              +this.updateIndisponiblity.referentielId;
          }

          const index = this.indisponibilities.findIndex(
            (i) => i.id === this.updateIndisponiblity?.id
          );
          const contentieux = this.allIndisponibilityReferentiel.find(
            (c) => c.id === this.updateIndisponiblity?.referentielId
          );

          if (index !== -1) {
            this.indisponibilities[index] = {
              ...this.indisponibilities[index],
              ...this.updateIndisponiblity,
              contentieux,
            };
          } else if (this.updateIndisponiblity) {
            this.indisponibilities.push({
              ...this.updateIndisponiblity,
              contentieux,
            });
          }
          this.updateIndisponiblity = null;
          this.controlIndisponibilities();
        }
        break;
      case 'delete':
        {
          const index = this.indisponibilities.findIndex(
            (i) =>
              i.id ===
              ((this.updateIndisponiblity && this.updateIndisponiblity.id) ||
                '')
          );
          if (index !== -1) {
            this.indisponibilities.splice(index, 1);
            this.controlIndisponibilities();
          }
          this.updateIndisponiblity = null;
        }
        break;
    }
  }

  onNewReferentiel(referentiels: ContentieuReferentielInterface[]) {
    this.updatedReferentiels = referentiels;
  }
}
