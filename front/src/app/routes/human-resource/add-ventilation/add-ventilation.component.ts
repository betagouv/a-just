import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
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
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service';

@Component({
  selector: 'add-ventilation',
  templateUrl: './add-ventilation.component.html',
  styleUrls: ['./add-ventilation.component.scss'],
})
export class AddVentilationComponent extends MainClass implements OnChanges {
  @Input() human: HumanResourceInterface | null = null;
  @Output() ventilationChange = new EventEmitter();
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = [];
  showNewVentilation: boolean = true;
  categories: HRCategoryInterface[] = [];
  fonctions: HRFonctionInterface[] = [];
  indisponibilities: RHActivityInterface[] = [];
  activities: RHActivityInterface[] = [];
  updateIndisponiblity: RHActivityInterface | null = null;
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
    private referentielService: ReferentielService,
    private humanResourceService: HumanResourceService
  ) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.hrFonctionService.getAll().then((list) => {
        this.fonctions = list;
      })
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
    this.form.get('activitiesStartDate')?.setValue(new Date());
    this.form.get('etp')?.setValue(((this.human && this.human.etp) || 0) * 100);
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
      ?.setValue(
        (this.human && this.human.category && this.human.category.id) || null
      );
    this.form
      .get('fonctionId')
      ?.setValue(
        (this.human && this.human.fonction && this.human.fonction.id) || null
      );

    const activities = (this.human && this.human.activities) || [];
    this.indisponibilities = activities.filter(
      (r) => this.referentielService.idsIndispo.indexOf(r.id) !== -1
    );
    this.activities = activities.filter(
      (r) => this.referentielService.idsIndispo.indexOf(r.id) === -1
    );
  }

  ngOnDestroy(): void {
    this.watcherDestroy();
  }

  onCancel() {
    this.form.reset();
    this.showNewVentilation = false;
  }

  onSave() {
    this.ventilationChange.emit(this.form.value);
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
          }
          this.updateIndisponiblity = null;
        }
        break;
    }
  }
}
