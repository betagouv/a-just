import { Component, OnDestroy } from '@angular/core'
import { ContentieuReferentielInterface } from 'src/app/interfaces/contentieu-referentiel'
import { MainClass } from 'src/app/libs/main-class'
import { ContentieuxOptionsService } from 'src/app/services/contentieux-options/contentieux-options.service'
import { HumanResourceService } from 'src/app/services/human-resource/human-resource.service'
import { ReferentielService } from 'src/app/services/referentiel/referentiel.service'
import { fixDecimal } from 'src/app/utils/numbers'

@Component({
    templateUrl: './average-etp.page.html',
    styleUrls: ['./average-etp.page.scss'],
})
export class AverageEtpPage extends MainClass implements OnDestroy {
    referentiel: ContentieuReferentielInterface[] = []
    perUnity: string = 'hour'

    constructor(
        private contentieuxOptionsService: ContentieuxOptionsService,
        private humanResourceService: HumanResourceService,
        private referentielService: ReferentielService
    ) {
        super()

        this.watch(
            this.humanResourceService.contentieuxReferentiel.subscribe(
                (ref) => {
                    this.referentiel = ref.filter(
                        (r) =>
                            this.referentielService.idsIndispo.indexOf(r.id) ===
                                -1 &&
                            this.referentielService.idsSoutien.indexOf(r.id) ===
                                -1
                    )
                }
            )
        )
    }

    ngOnDestroy() {
        this.watcherDestroy()
    }

    onUpdateOptions(
        referentiel: ContentieuReferentielInterface,
        value: number
    ) {
        this.contentieuxOptionsService.updateOptions({
            ...referentiel,
            averageProcessingTime: !value
                ? null
                : this.perUnity === 'hour'
                ? value
                : fixDecimal(8 / value),
        })
    }

    changeUnity(unit: string) {
        this.perUnity = unit
    }
}
