import { Component, OnDestroy } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { ActivitiesService } from 'src/app/services/activities/activities.service'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'

@Component({
  templateUrl: './average-etp.page.html',
  styleUrls: ['./average-etp.page.scss'],
})
export class AverageEtpPage extends MainClass implements OnDestroy {
  referentiel: ContentieuReferentielInterface[] = []
  perUnity: string = 'hour'
  isLoading: boolean = false
  subTitle: string = ''

  constructor(
    private contentieuxOptionsService: ContentieuxOptionsService,
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    private activitiesService: ActivitiesService
  ) {
    super()

    this.watch(
      this.contentieuxOptionsService.backupId.subscribe((backupId) => {
        if (backupId !== null) {
          this.onLoad(backupId)
          console.log('On charge')
          this.contentieuxOptionsService.getLastUpdate()
        }
      })
    )

    this.watch(
      this.contentieuxOptionsService.contentieuxLastUpdate.subscribe(
        (lastUpdate) => {
          if (lastUpdate !== null) {
            console.log(
              'valeur chargé',
              this.contentieuxOptionsService.contentieuxLastUpdate.getValue()
            )
            const res =
              this.contentieuxOptionsService.contentieuxLastUpdate.getValue()
            if (res !== undefined)
              this.subTitle =
                'Mis à jour, le' +
                res.date +
                ', par' +
                res.user.firstName +
                ' ' +
                res.user.lastName
          }
        }
      )
    )
  }

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

        ref.childrens = (ref.childrens || []).map((c) => {
          const getOptionActivity = options.find(
            (a) => a.contentieux.id === c.id
          )
          c.averageProcessingTime =
            (getOptionActivity && getOptionActivity.averageProcessingTime) ||
            null

          return c
        })

        return ref
      })

      this.isLoading = false
    })
  }

  onUpdateOptions(referentiel: ContentieuReferentielInterface, value: number) {
    this.contentieuxOptionsService.updateOptions({
      ...referentiel,
      averageProcessingTime: !value
        ? null
        : this.perUnity === 'hour'
        ? value
        : 8 / value,
    })
  }

  changeUnity(unit: string) {
    this.perUnity = unit
  }
}
