import { AfterViewInit, Component, Input } from '@angular/core'
import { HELP_AUTOSTART, HELP_AUTOSTART_AND_STOP, HELP_START, HELP_STOP } from 'src/app/constants/log-codes'
import { KPIService } from 'src/app/services/kpi/kpi.service'
import { today } from 'src/app/utils/dates'

declare const introJs: any
declare const window: any

export interface IntroJSStep {
  target: string
  title?: string
  intro?: string
  options?: object
  actions?: object
  beforeLoad?: Function
}

/** sample step
[{
  element: document.querySelector('.intro-step-1'),
  title: 'Welcome',
  intro: 'Hello World! 👋'
}*/

/**
 * Composant s'occupe d'Intro JS
 */

@Component({
  selector: 'aj-intro-js',
  templateUrl: './intro-js.component.html',
  styleUrls: ['./intro-js.component.scss'],
})
export class IntroJSComponent implements AfterViewInit {
  /**
   * Etapes d'intros text dans l'alerte
   */
  @Input() steps: IntroJSStep[] = []
  /**
   * Identifiant unique
   */
  @Input() typeId: string | undefined
  /**
   * has complete form
   */
  hasCompleteForm: boolean = false

  constructor(private kpiService: KPIService) { }

  ngAfterViewInit(): void {
    if (this.steps) {
      let canStartPlayer = true
      if (this.typeId) {
        const idUsed = localStorage.getItem('INTRO_JS_' + this.typeId)
        if (idUsed) {
          this.hasCompleteForm = true
          canStartPlayer = false
        }
      }

      if (canStartPlayer) {
        this.startPlayer(false)
      }
    }
  }

  startPlayer(log = true) {
    if (log) {
      this.kpiService.register(HELP_START, '')
    } else {
      this.kpiService.register(HELP_AUTOSTART, '')
    }

    setTimeout(() => {
      this.hasCompleteForm = false

      let listFunctions: string[] = []
      const formatActionsToHtml = (actions: any) => {
        actions = actions || {}
        let html = ''
        let allActions = Object.keys(actions).filter(
          (a) => actions[a].enable === 'undefined' || actions[a].enable === true
        )
        if (allActions.length) {
          html += '<div class="intro-js-action">'
          allActions.map((key) => {
            // ne fonctionne pas a cause du CSP
            html += `<button onclick="window.INTROJS_AJ_${key}()">${actions[key].label}</button>`
          })

          html += ''
        }

        return html
      }

      const allStep = this.steps.map((s) => {
        return {
          ...s,
          element: document.querySelector(s.target),
          intro: (s.intro || '') + formatActionsToHtml(s.actions),
          ...(s.options || {}),
        }
      })
      const intro = introJs().setOptions({
        nextLabel: 'Suivant',
        prevLabel: 'Précédent',
        doneLabel: 'Terminer la présentation',
        steps: allStep,
      })
      intro.onchange(() => {
        const currentStep = allStep[intro.currentStep()]

        if (currentStep.actions) {
          Object.keys(currentStep.actions).map((key) => {
            window['INTROJS_AJ_' + key] = () => {
              // @ts-ignore
              currentStep.actions[key].call.apply(null, arguments)
              intro.exit()
            }
            listFunctions.push('INTROJS_AJ_' + key)
          })
        }
      })
      intro.onbeforechange(async () => {
        const currentStep = allStep[intro.currentStep()]
        currentStep.element = document.querySelector(currentStep.target)

        if (currentStep.beforeLoad) {
          await currentStep.beforeLoad(intro)
        }

        const domElement = document.querySelector(currentStep.target)
        if (domElement) {
          intro._introItems[intro.currentStep()].element = domElement
          intro.refresh() // NE MARCHE PAS !!!!
        }

        listFunctions.map((f) => {
          window[f] = null
        })
        listFunctions = []
      })
      intro.onexit(() => {
        if (log) {
          this.kpiService.register(HELP_STOP, (this.typeId ? this.typeId + '_' : '') + intro.currentStep() + 1)
        } else {
          this.kpiService.register(HELP_AUTOSTART_AND_STOP, (this.typeId ? this.typeId + '_' : '') + intro.currentStep() + 1)
        }

        if (this.typeId) {
          localStorage.setItem(
            'INTRO_JS_' + this.typeId,
            today().getTime() + ''
          )
          this.hasCompleteForm = true
        }
      })
      intro.start()
    }, 200)
  }
}
