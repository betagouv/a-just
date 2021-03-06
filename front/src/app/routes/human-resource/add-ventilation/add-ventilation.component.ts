import {
  Component,
  Input,
  OnChanges,
  Output,
  EventEmitter,
  SimpleChanges,
} from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { maxBy, minBy, sumBy } from 'lodash'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { HRCategoryInterface } from 'src/app/interfaces/hr-category'
import { HRFonctionInterface } from 'src/app/interfaces/hr-fonction'
import { HumanResourceInterface } from 'src/app/interfaces/human-resource-interface'
import { RHActivityInterface } from 'src/app/interfaces/rh-activity'
import { MainClass } from 'src/app/libs/main-class'
import { HRCategoryService } from 'src/app/services/hr-category/hr-category.service'
import { HRFonctionService } from 'src/app/services/hr-fonction/hr-function.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { today } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'

@Component({
  selector: 'add-ventilation',
  templateUrl: './add-ventilation.component.html',
  styleUrls: ['./add-ventilation.component.scss'],
})
export class AddVentilationComponent extends MainClass implements OnChanges {
  @Input() human: HumanResourceInterface | null = null
  @Input() indisponibilities: RHActivityInterface[] = []
  @Input() activities: RHActivityInterface[] = []
  @Input() lastDateStart: Date | null = null
  @Input() dateStop: Date | null = null
  @Input() indisponibilityError: string | null = null
  @Input() saveActions: boolean = false
  @Input() isEdit: boolean = false
  @Output() onSaveConfirm = new EventEmitter()
  @Output() addIndispiniblity = new EventEmitter()
  @Output() close = new EventEmitter()
  allIndisponibilityReferentiel: ContentieuReferentielInterface[] = []
  categories: HRCategoryInterface[] = []
  fonctions: HRFonctionInterface[] = []
  updatedReferentiels: ContentieuReferentielInterface[] = []
  etp: number = 1
  form = new FormGroup({
    activitiesStartDate: new FormControl(new Date(), [Validators.required]),
    etp: new FormControl<number|null>(null, [Validators.required]),
    fonctionId: new FormControl<number|null>(null, [Validators.required]),
    categoryId: new FormControl<number|null>(null, [Validators.required]),
  })

  constructor(
    private hrFonctionService: HRFonctionService,
    private hrCategoryService: HRCategoryService,
    private humanResourceService: HumanResourceService
  ) {
    super()
  }

  ngOnInit() {
    this.watch(
      this.hrFonctionService.getAll().then(() => this.loadCategories())
    )
    this.watch(
      this.hrCategoryService.getAll().then((list) => (this.categories = list))
    )
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe(
        () =>
          (this.allIndisponibilityReferentiel =
            this.humanResourceService.allIndisponibilityReferentiel.slice(1))
      )
    )
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.lastDateStart) {
      this.onStart()
    }
  }

  onStart() {
    const situation = this.humanResourceService.findSituation(this.human)

    this.etp = (situation && situation.etp) || 0

    this.form
      .get('activitiesStartDate')
      ?.setValue(this.lastDateStart ? new Date(this.lastDateStart) : null)
    this.form.get('etp')?.setValue(((situation && situation.etp) || 0) * 100)
    this.form
      .get('categoryId')
      ?.setValue(
        (situation && situation.category && situation.category.id) || null
      )
    this.form
      .get('fonctionId')
      ?.setValue(
        (situation && situation.fonction && situation.fonction.id) || null
      )

    this.watch(
      this.form
        .get('categoryId')
        ?.valueChanges.subscribe(() => this.loadCategories())
    )

    this.loadCategories()
  }

  ngOnDestroy(): void {
    this.watcherDestroy()
  }

  async loadCategories() {
    if (this.form.value) {
      this.fonctions = (await this.hrFonctionService.getAll()).filter(
        (c) => this.form.value?.categoryId == c.categoryId
      )
    }
  }

  async onSave() {
    if (this.indisponibilityError) {
      alert(this.indisponibilityError)
      return
    }

    const totalAffected = fixDecimal(sumBy(this.updatedReferentiels, 'percent'))
    if (totalAffected > 100) {
      alert(
        `Attention, avec les autres affectations, vous avez atteint un total de ${totalAffected}% de ventilation ! Vous ne pouvez passer au dessus de 100%.`
      )
      return
    }

    // find indisponibility dates
    const listIndispoDateStart = this.indisponibilities.reduce<Date[]>(
      (acc, current) => {
        if (current.dateStart) {
          const dateStart = new Date(current.dateStart)
          acc.push(dateStart)
        }

        return acc
      },
      []
    )
    const minIndispoDateStart = minBy(listIndispoDateStart, function (o) {
      return o.getTime()
    })
    const maxIndispoDateStart = maxBy(listIndispoDateStart, function (o) {
      return o.getTime()
    })
    const listIndispoDateStop = this.indisponibilities.reduce<Date[]>(
      (acc, current) => {
        if (current.dateStop) {
          const dateStop = new Date(current.dateStop)
          acc.push(dateStop)
        }

        return acc
      },
      []
    )
    const minIndispoDateStop = minBy(listIndispoDateStop, function (o) {
      return o.getTime()
    })
    const maxIndispoDateStop = maxBy(listIndispoDateStop, function (o) {
      return o.getTime()
    })

    let { activitiesStartDate, categoryId, fonctionId } = this.form.value
    if (!activitiesStartDate) {
      alert('Vous devez saisir une date de d??but de situation !')
      return
    }

    activitiesStartDate = new Date(activitiesStartDate)
    if (this.human && this.human.dateEnd && activitiesStartDate) {
      const dateEnd = new Date(this.human.dateEnd)

      // check activity date
      if (activitiesStartDate.getTime() > dateEnd.getTime()) {
        alert(
          'Vous ne pouvez pas saisir une situation post??rieure ?? la date de d??part !'
        )
        return
      }
    }

    if (this.human && this.human.dateStart && activitiesStartDate) {
      const dateStart = new Date(this.human.dateStart)

      // check activity date
      if (activitiesStartDate.getTime() < dateStart.getTime()) {
        alert(
          "Vous ne pouvez pas saisir une situation ant??rieure ?? la date d'arriv??e !"
        )
        return
      }
    }

    const categories = this.humanResourceService.categories.getValue()
    const fonctions = this.humanResourceService.fonctions.getValue()
    const cat = categories.find((c) => categoryId && c.id == categoryId)
    const fonct = fonctions.find((c) => c.id == fonctionId)

    if (!cat) {
      alert('Vous devez saisir une cat??gorie !')
      return
    }

    if (!fonct) {
      alert('Vous devez saisir une fonction !')
      return
    }

    const situations = this.generateAllNewSituations(
      this.updatedReferentiels,
      activitiesStartDate,
      this.form.value,
      cat,
      fonct
    )

    if (this.human) {
      if (
        await this.humanResourceService.updatePersonById(this.human?.id, {
          situations,
          indisponibilities: this.indisponibilities,
        })
      ) {
        this.onSaveConfirm.emit(true)
      }
    }
  }

  generateAllNewSituations(
    newReferentiel: ContentieuReferentielInterface[],
    activitiesStartDate: Date,
    profil: any,
    cat: HRCategoryInterface,
    fonct: HRFonctionInterface
  ) {
    let situations = this.human?.situations || []
    const activities: any[] = []
    newReferentiel
      .filter((r) => r.percent && r.percent > 0)
      .map((r) => {
        activities.push({
          percent: r.percent || 0,
          contentieux: r,
        })
        ;(r.childrens || [])
          .filter((r) => r.percent && r.percent > 0)
          .map((child) => {
            activities.push({
              percent: child.percent || 0,
              contentieux: child,
            })
          })
      })

    // find if situation is in same date
    const isSameDate = situations.findIndex((s) => {
      const day = today(s.dateStart)
      return activitiesStartDate.getTime() === day.getTime()
    })

    if (isSameDate !== -1) {
      situations[isSameDate] = {
        ...situations[isSameDate],
        etp: profil.etp / 100,
        category: cat,
        fonction: fonct,
        activities,
      }
    } else {
      situations.splice(0, 0, {
        id: -1,
        etp: profil.etp / 100,
        category: cat,
        fonction: fonct,
        dateStart: activitiesStartDate,
        activities,
      })
    }

    return situations
  }

  onNewReferentiel(referentiels: ContentieuReferentielInterface[]) {
    this.updatedReferentiels = referentiels
  }
}
