import { Component, OnDestroy } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { dataInterface } from 'src/app/components/select/select.component'
import { BackupInterface } from 'src/app/interfaces/backup'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { findRealValue } from 'src/app/utils/dates'
import { fixDecimal } from 'src/app/utils/numbers'

@Component({
  templateUrl: './average-etp.page.html',
  styleUrls: ['./average-etp.page.scss'],
})
export class AverageEtpPage extends MainClass implements OnDestroy {
  referentiel: ContentieuReferentielInterface[] = []
  perUnity: string = 'hour'
  isLoading: boolean = false
  subTitleDate: string = ''
  subTitleName: string = ''
  categorySelected: string = 'MAGISTRATS'
  backups: BackupInterface[] = []
  selectedIds: any[] = []
  formDatas: dataInterface[] = []
  initValue: boolean = false

  constructor(
    private contentieuxOptionsService: ContentieuxOptionsService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private activitiesService: ActivitiesService
  ) {
    super()

    this.watch(
      this.contentieuxOptionsService.backups.subscribe((b) => {
        this.backups = b
        this.formatDatas()
      })
    )
    this.watch(
      this.contentieuxOptionsService.backupId.subscribe(
        (b) => (this.selectedIds = [b])
      )
    )

    this.watch(
      this.contentieuxOptionsService.optionsIsModify.subscribe((b) => {
        if (b === false) {
        }
      })
    )
    this.watch(
      this.contentieuxOptionsService.initValue.subscribe((b) => {
        if (b === true) {
          this.referentiel.map((v) => {
            v.isModified = false
            v.averageProcessingTime = v.defaultValue
            v.averageProcessingTimeFonc = v.defaultValueFonc

            if (v.childrens !== undefined) {
              v.childrens.map((child) => {
                if (child.isModified === true) {
                  child.isModified = false
                  //child.averageProcessingTime = child.defaultValue
                  //child.averageProcessingTimeFonc = child.defaultValueFonc
                }
              })
            }
          })

          //this.contentieuxOptionsService.initValue.next(false)
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.backupId.subscribe((backupId) => {
        if (backupId !== null) {
          this.onLoad(backupId)
          this.contentieuxOptionsService.getLastUpdate()
          this.referentiel.map((v) => {
            v.defaultValue = v.averageProcessingTime
            v.defaultValueFonc = v.averageProcessingTimeFonc

            v.isModified = false
          })
          //this.contentieuxOptionsService.optionsIsModify.next(false)
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.contentieuxLastUpdate.subscribe(
        (lastUpdate) => {
          if (lastUpdate !== null && lastUpdate !== undefined) {
            const res =
              this.contentieuxOptionsService.contentieuxLastUpdate.getValue()
            if (res !== undefined && res.date) {
              let strDate = findRealValue(new Date(res.date))
              strDate = strDate === '' ? " aujourd'hui" : ' le ' + strDate
              this.subTitleDate = 'Mis à jour' + strDate + ', par '
              this.subTitleName = res.user.firstName + ' ' + res.user.lastName
            }
          } else {
            this.subTitleDate = ''
            this.subTitleName = ''
          }
        }
      )
    )
  }

  onChangeBackup(id: any[]) {
    if (
      this.contentieuxOptionsService.optionsIsModify.getValue() &&
      !confirm('Vous avez des modifications en cours. Supprimer ?')
    ) {
      this.selectedIds = [this.contentieuxOptionsService.backupId.getValue()]
      return
    }

    if (id.length) {
      this.contentieuxOptionsService.backupId.next(id[0])
    }
  }

  formatDatas() {
    if (
      this.selectedIds &&
      this.selectedIds.length &&
      !this.backups.find((b) => b.id === this.selectedIds[0])
    ) {
      this.selectedIds = []
    }

    this.formDatas = this.backups.map((back) => {
      const date = new Date(back.date)

      return {
        id: back.id,
        value: `${back.label} du ${(date.getDate() + '').padStart(
          2,
          '0'
        )} ${this.getShortMonthString(date)} ${date.getFullYear()}`,
      }
    })
  }

  getLogOfLastUpdate() {}
  ngOnDestroy() {
    this.watcherDestroy()
  }

  onLoad(backupId: number) {
    let res = this.activitiesService.loadMonthActivities(new Date())
    this.isLoading = true
    this.contentieuxOptionsService.loadDetails(backupId).then((options) => {
      this.contentieuxOptionsService.contentieuxOptions.next(options)

      const referentiels = [
        ...this.humanResourceService.contentieuxReferentiel.getValue(),
      ].filter(
        (r) =>
          this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
          this.referentielService.idsSoutien.indexOf(r.id) === -1
      )

      // todo set in, out, stock for each
      this.referentiel = referentiels.map((ref) => {
        const getOption = options.find((a) => a.contentieux.id === ref.id)
        ref.averageProcessingTime =
          (getOption && getOption.averageProcessingTime) || null

        ref.averageProcessingTimeFonc =
          (getOption && getOption.averageProcessingTimeFonc) || null

        ref.defaultValue = ref.averageProcessingTime
        ref.defaultValueFonc = ref.averageProcessingTimeFonc

        ref.isModified = false

        ref.childrens = (ref.childrens || []).map((c) => {
          const getOptionActivity = options.find(
            (a) => a.contentieux.id === c.id
          )
          c.averageProcessingTime =
            (getOptionActivity && getOptionActivity.averageProcessingTime) ||
            null

          c.averageProcessingTimeFonc =
            (getOptionActivity &&
              getOptionActivity.averageProcessingTimeFonc) ||
            null
          c.defaultValue = c.averageProcessingTime
          c.defaultValueFonc = c.averageProcessingTimeFonc
          c.isModified = false

          return c
        })

        return ref
      })

      this.isLoading = false
    })
  }

  onUpdateOptions(
    referentiel: ContentieuReferentielInterface,
    value: number,
    unit: string
  ) {
    referentiel[this.getCategoryStr()] = this.getInputValue(value, unit)
    this.contentieuxOptionsService.updateOptions({
      ...referentiel,
      averageProcessingTimeFonc: referentiel.averageProcessingTimeFonc,
      averageProcessingTime: referentiel.averageProcessingTime,
    })

    referentiel.isModified = true
  }

  changeUnity(unit: string) {
    this.perUnity = unit
  }

  changeCategorySelected(category: string) {
    this.categorySelected = category
    console.log(this.categorySelected, this.getCategoryStr())
  }

  getInputValue(avgProcessTime: any, unit: string) {
    switch (this.getCategoryStr()) {
      case 'averageProcessingTime':
        break
      case 'averageProcessingTimeFonc':
        break
    }
    //console.log(avgProcessTime)
    if (unit === 'hour') {
      return avgProcessTime
    } else if (unit === 'nbPerDay') {
      return 8 / avgProcessTime
    } else if (unit === 'nbPerMonth') {
      return (8 / avgProcessTime) * (208 / 12)
    }
    return '0'
  }

  getField(
    referentiel: ContentieuReferentielInterface,
    event: any,
    unit: string
  ) {
    event.target.blur()
    this.onUpdateOptions(referentiel, event.target.value, unit)
    referentiel.isModified = true
  }

  getCategoryStr() {
    if (this.categorySelected === 'MAGISTRATS') return 'averageProcessingTime'
    else if (this.categorySelected === 'FONCTIONNAIRES')
      return 'averageProcessingTimeFonc'
    else return 'averageProcessingTime'
  }
}
