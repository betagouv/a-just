import { Component, OnDestroy } from '@angular/core'
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

/**
 * Page des temps moyens par dossier
 */

@Component({
  templateUrl: './average-etp.page.html',
  styleUrls: ['./average-etp.page.scss'],
})
export class AverageEtpPage extends MainClass implements OnDestroy {
  /**
   * Référentiel complet
   */
  referentiel: ContentieuReferentielInterface[] = []
  /**
   * Unité de mesure de saisi
   */
  perUnity: string = 'hour'
  /**
   * En cours de chargement
   */
  isLoading: boolean = false
  /**
   * Titre de la page
   */
  subTitleDate: string = ''
  /**
   * Sous titre de la page
   */
  subTitleName: string = ''
  /**
   * Catégorie selectionné (MAGISTRATS, FONCTIONNAIRES)
   */
  categorySelected: string = 'MAGISTRATS'
  /**
   * Liste des sauvegardes
   */
  backups: BackupInterface[] = []
  /**
   * Liste des sauvegardes des temps mouens
   */
  selectedIds: any[] = []
  /**
   * Liste des sauvegardes formatés pour le menu roulant
   */
  formDatas: dataInterface[] = []
  
  /**
   * Constructeur
   * @param contentieuxOptionsService 
   * @param humanResourceService 
   * @param referentielService 
   * @param activitiesService 
   */
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
      this.contentieuxOptionsService.initValue.subscribe((b) => {
        if (b === true) {
          this.referentiel.map((v) => {
            v.isModified = false
            v.isModifiedFonc = false

            v.averageProcessingTime = v.defaultValue
            v.averageProcessingTimeFonc = v.defaultValueFonc

            if (v.childrens !== undefined) {
              v.childrens.map((child) => {
                if (child.isModified === true) {
                  child.isModified = false
                  child.isModifiedFonc = false

                  child.averageProcessingTime = child.defaultValue
                  child.averageProcessingTimeFonc = child.defaultValueFonc
                }
              })
            }
          })
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.backupId.subscribe((backupId) => {
        if (backupId !== null) {
          this.onLoad(backupId)
          this.contentieuxOptionsService.getLastUpdate()
          this.referentiel.map((v) => {
            v.isModified = false
            v.isModifiedFonc = false
          })
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

  /**
   * Change l'id de la sauvegarde
   * @param id 
   * @returns 
   */
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

  /**
   * Formate le menu déroulant avec la liste de toutes les sauvegardes
   */
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

  /**
   * Destruction des observables 
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Chargement des temps moyens par dossier
   * @param backupId 
   */
  onLoad(backupId: number) {
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
        ref.isModifiedFonc = false

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
          c.isModifiedFonc = false

          return c
        })

        return ref
      })

      this.isLoading = false
    })
  }

  /**
   * Modification d'un temps moyen
   * @param referentiel 
   * @param value 
   * @param unit 
   */
  onUpdateOptions(
    referentiel: ContentieuReferentielInterface,
    value: number,
    unit: string
  ) {
    if (
      value !== null &&
      fixDecimal(
        this.getInputValue(referentiel[this.getCategoryStr()], unit),
        100
      ) !== value
    ) {
      referentiel[this.getCategoryStr()] = this.getInputValue(value, unit)
      this.contentieuxOptionsService.updateOptions({
        ...referentiel,
        averageProcessingTimeFonc: referentiel.averageProcessingTimeFonc,
        averageProcessingTime: referentiel.averageProcessingTime,
      })

      if (this.categorySelected === 'MAGISTRATS') referentiel.isModified = true
      else referentiel.isModifiedFonc = true
    }
  }

  /**
   * Change l'unité de mesure
   * @param unit 
   */
  changeUnity(unit: string) {
    this.perUnity = unit
  }

  /**
   * Change les catégories
   * @param category 
   */
  changeCategorySelected(category: string) {
    this.categorySelected = category
  }

  /**
   * Retourne le temps de traitement d'un point de vue humain
   * @param avgProcessTime 
   * @param unit 
   * @returns 
   */
  getInputValue(avgProcessTime: any, unit: string) {
    switch (this.getCategoryStr()) {
      case 'averageProcessingTime':
        if (unit === 'hour') {
          return avgProcessTime
        } else if (unit === 'nbPerDay') {
          return 8 / avgProcessTime
        } else if (unit === 'nbPerMonth') {
          return (8 / avgProcessTime) * (208 / 12)
        }
        break
      case 'averageProcessingTimeFonc':
        if (unit === 'hour') {
          return avgProcessTime
        } else if (unit === 'nbPerDay') {
          return 7 / avgProcessTime
        } else if (unit === 'nbPerMonth') {
          return (7 / avgProcessTime) * (229.57 / 12)
        }
        break
    }
    return '0'
  }

  /**
   * Modife le champs d'un temps mouens
   * @param referentiel 
   * @param event 
   * @param unit 
   */
  getField(
    referentiel: ContentieuReferentielInterface,
    event: any,
    unit: string
  ) {
    event.target.blur()
    if (
      event.target.value !== '' &&
      fixDecimal(
        this.getInputValue(referentiel[this.getCategoryStr()], unit),
        100
      ) !== parseFloat(event.target.value)
    ) {
      this.onUpdateOptions(referentiel, event.target.value, unit)
      if (this.categorySelected === 'MAGISTRATS') referentiel.isModified = true
      else referentiel.isModifiedFonc = true
    }
  }

  /**
   * Liste des catégories
   * @returns 
   */
  getCategoryStr() {
    if (this.categorySelected === 'MAGISTRATS') return 'averageProcessingTime'
    else if (this.categorySelected === 'FONCTIONNAIRES')
      return 'averageProcessingTimeFonc'
    else return 'averageProcessingTime'
  }

  /**
   * Noeu de catégorie 
   * @returns 
   */
  getCategoryModifStr() {
    if (this.categorySelected === 'MAGISTRATS') return 'isModified'
    else return 'isModifiedFonc'
  }
}
