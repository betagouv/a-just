import { Component, Input, OnChanges } from '@angular/core'
import { DATA_GITBOOK, NOMENCLATURE_DOWNLOAD_URL } from 'src/app/constants/documentation'
import { ContentieuReferentielActivitiesInterface, ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { AppService } from 'src/app/services/app/app.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'

/**
 * Composant page activité
 */
@Component({
  selector: 'aj-popin-edit-activities',
  templateUrl: './popin-edit-activities.component.html',
  styleUrls: ['./popin-edit-activities.component.scss'],
})
export class PopinEditActivitiesComponent extends MainClass implements OnChanges {
  /**
   * Référentiel
   */
  @Input() referentiel: ContentieuReferentielInterface | null = null
  /**
   * Databook url
   */
  DATA_GITBOOK = DATA_GITBOOK
  /**
   * Nomeclature url
   */
  NOMENCLATURE_DOWNLOAD_URL = NOMENCLATURE_DOWNLOAD_URL

  /**
   * Constructeur
   * @param appService
   */
  constructor(private appService: AppService, private referentielService: ReferentielService) {
    super()
  }

  ngOnChanges() {
    console.log('new ref', this.referentiel)
  }

  /**
   * Retour des titres des infos bulles
   * @param type
   * @param contentieux
   * @param value
   * @returns
   */
  getTooltipTitle(
    type: 'entrees' | 'sorties' | 'stock',
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null
  ) {
    const activityUpdated = contentieux.activityUpdated
    const modifyBy =
      activityUpdated && activityUpdated[type] ? activityUpdated[type] : null
    let string = `<div class="flex-center"><i class="margin-right-8 color-white ${
      value !== null
        ? modifyBy
          ? 'ri-lightbulb-flash-fill'
          : 'ri-lightbulb-flash-line'
        : ''
    }"></i><p class="color-white">`

    switch (type) {
      case 'entrees':
        string += 'Entrées A-JUSTées'
        break
      case 'sorties':
        string += 'Sorties A-JUSTées'
        break
      case 'stock':
        string += 'Stock A-JUSTé'

        if (value !== null) {
          const isMainActivity =
            this.referentielService.mainActivitiesId.indexOf(contentieux.id) !==
            -1
          const activityUpdated = contentieux.activityUpdated
          const modifyBy =
            activityUpdated && activityUpdated[type]
              ? activityUpdated[type]
              : null
          if (isMainActivity || !modifyBy) {
            string += ' - Calculé'
          }
        }
        break
    }
    string += '</p></div>'

    if (value !== null && modifyBy) {
      const date = new Date(modifyBy.date)
      string += `<p class="color-white font-size-12">Modifié par <b>${
        modifyBy.user?.firstName
      } ${
        modifyBy.user?.lastName
      }</b> le ${date.getDate()} ${this.getShortMonthString(
        date
      )} ${date.getFullYear()}</p>`
    }

    return string
  }

  /**
   * Retour du contenu des tooltips
   * @param type
   * @param contentieux
   * @param value
   * @param level
   * @returns
   */
  getTooltipBody(
    type: 'entrees' | 'sorties' | 'stock',
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null,
    level: number
  ) {
    const activityUpdated = contentieux.activityUpdated
    const modifyBy =
      value !== null && activityUpdated && activityUpdated[type]
        ? activityUpdated[type]
        : null

    switch (type) {
      case 'entrees':
      case 'sorties':
        if (level === 3) {
          if (value !== null) {
            return `Dès lors que des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } sont saisies dans l'un des sous-contentieux de cette colonne, le total des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } de ce contentieux s'A-JUSTe automatiquement en additionnant les données A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres.`
          } else {
            return `Dès lors que des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } seront saisies dans l'un des sous-contentieux de cette colonne, le total des ${
              type === 'entrees' ? 'entrées' : 'sorties'
            } de ce contentieux s'A-JUSTera automatiquement en additionnant les données A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres.`
          }
        } else {
          if (modifyBy) {
            return `Dès lors que cette donnée ${
              type === 'entrees' ? "d'entrées" : 'de sorties'
            } mensuelles est modifié manuellement, votre stock est recalculé en prenant en compte cette valeur dans "Stock A-JUSTé".`
          } else {
            return `Dès lors que cette donnée ${
              type === 'entrees' ? "d'entrées" : 'de sorties'
            } mensuelles sera modifiée manuellement, votre stock sera recalculé en prenant en compte cette valeur dans "Stock A-JUSTé"`
          }
        }
      case 'stock': {
        if (level === 3) {
          if (value !== null) {
            return "Dès lors que des données de stock ont été saisies manuellement ou calculées dans l'un des sous-contentieux de cette colonne, le total du stock de ce contentieux s'A-JUSTe automatiquement en additionnant les données de stock A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres."
          } else {
            return "Dès lors que des données de stock seront saisies manuellement ou calculées dans l'un des sous-contentieux de cette colonne, le total du stock de ce contentieux s'A-JUSTera automatiquement en additionnant les données de stock A-JUSTées pour les sous-contentieux où il y en a, et les données logiciel pour les autres."
          }
        } else {
          if (modifyBy) {
            return `Cette donnée a été saisie manuellement et sera prise en compte pour le calcul du stock des mois prochains.<br/>Si vous modifiez les entrées et/ou les sorties ou données de stock des mois antérieurs, cette valeur ne sera pas modifiée.`
          } else if (value !== null) {
            return `Cette valeur de stock a été recalculée automatiquement, car vous avez saisi des données d'entrées, sorties ou stock pour l'un des mois précédents, ou parce que vous avez A-JUSTé les entrées ou sorties du mois en cours. <br/>Les stocks des prochains mois seront également recalculés à partir de cette valeur.<br/>Vous pouvez modifier manuellement cette donnée. Le cas échéant, les stocks des prochains mois seront recalculés à partir de la valeur que vous aurez saisie.<br/>Dès lors que vous A-JUSTez manuellement un stock, il ne sera plus recalculé, même si vous modifiez les entrées ou sorties du mois en cours ou des mois antérieurs.`
          } else {
            return `Cette valeur de stock sera recalculée automatiquement, dès lors que vous aurez saisi des données d'entrées, sorties ou stock pour l'un des mois précédents, ou si vous avez A-JUSTé les entrées ou sorties du mois en cours. Si vous modifiez manuellement cette donnée, les stocks des prochains mois seront recalculés à partir de la valeur que vous aurez saisie.<br/>Dès lors que vous A-JUSTez manuellement un stock, il ne sera plus recalculé, même si vous modifiez les entrées ou sorties des mois antérieurs.`
          }
        }
      }
    }
  }

  /**
   * Retourne le pied des tooltips
   * @param type
   * @param contentieux
   * @param value
   * @param level
   * @returns
   */
  getTooltipFooter(
    type: string,
    contentieux: ContentieuReferentielActivitiesInterface,
    value: number | null,
    level: number
  ) {
    if (type === 'stock' && level === 4) {
      if (value !== null) {
        const activityUpdated = contentieux.activityUpdated
        const modifyBy =
          activityUpdated && activityUpdated[type]
            ? activityUpdated[type]
            : null

        if (modifyBy) {
          return ''
        }

        return `Calcul :<br/>Stock A-JUSTé M = stock* mois M-1 + entrées* mois M - sorties* mois M<br/>* le stock A-JUSTé se recalcule dès lors qu'au moins l'une de ces 3 valeurs a été A-JUSTée`
      }

      return 'Calcul :<br/>Stock mois M = Stock mois M-1 + Entrées mois M - Sorties mois M'
    }

    return ''
  }
}
