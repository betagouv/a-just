import { HostListener, inject, Injectable } from '@angular/core'
import { KPIService } from '../kpi/kpi.service'
import { HELP_AUTOSTART, HELP_AUTOSTART_AND_STOP, HELP_START, HELP_STOP } from '../../constants/log-codes'
import { today } from '../../utils/dates'

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

/**
 * Service de gestion des tours
 */
@Injectable({
  providedIn: 'root',
})
export class TourService {
  kpiService = inject(KPIService)
  /**
   * Etapes d'intros text dans l'alerte
   */
  steps: IntroJSStep[] = []
  /**
   * Identifiant unique
   */
  typeId: string = window.location.pathname.split('/').pop() || ''
  /**
   * Rejouer systématiquement
   */
  playEachTime: boolean = false
  /**
   * has complete form
   */
  hasCompleteForm: boolean = false
  /**
   * Intro JS instance
   */
  intro: any

  nodeEnv = import.meta.env.NG_APP_NODE_ENV

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    if (this.intro) {
      this.intro.exit()
    }
  }

  initTour(tour: IntroJSStep[]) {
    this.steps = tour
    if (this.steps && this.nodeEnv !== 'test') {
      let canStartPlayer = true
      if (this.typeId && this.playEachTime === false) {
        const idUsed = localStorage.getItem('INTRO_JS_' + this.typeId)
        if (idUsed) {
          // Defer UI-bound state assignment to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => (this.hasCompleteForm = true), 0)
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
        let allActions = Object.keys(actions).filter((a) => actions[a].enable === 'undefined' || actions[a].enable === true)
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
      this.intro = introJs().setOptions({
        nextLabel: 'Suivant',
        prevLabel: 'Précédent',
        doneLabel: 'Terminer la présentation',
        steps: allStep,
      })
      this.intro.onchange(() => {
        const currentStep = allStep[this.intro.currentStep()]

        if (currentStep.actions) {
          Object.keys(currentStep.actions).map((key) => {
            window['INTROJS_AJ_' + key] = () => {
              // @ts-ignore
              currentStep.actions[key].call.apply(null, arguments)
              this.intro.exit()
            }
            listFunctions.push('INTROJS_AJ_' + key)
          })
        }
      })
      this.intro.onbeforechange(async () => {
        const currentStep = allStep[this.intro.currentStep()]
        currentStep.element = document.querySelector(currentStep.target)

        let interval = setInterval(() => {
          const introTooltip: any = document.querySelector('.introjs-tooltip')
          if (introTooltip) {
            clearInterval(interval)
            introTooltip.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }, 600)

        if (currentStep.beforeLoad) {
          await currentStep.beforeLoad(this.intro)
        }

        const domElement = document.querySelector(currentStep.target)
        if (domElement) {
          this.intro._introItems[this.intro.currentStep()].element = domElement
          this.intro.refresh() // NE MARCHE PAS !!!!
        }

        listFunctions.map((f) => {
          window[f] = null
        })
        listFunctions = []
      })
      this.intro.onexit(() => {
        this.close()

        if (log) {
          this.kpiService.register(HELP_STOP, (this.typeId ? this.typeId + '_' : '') + (this.intro.currentStep() + 1))
        } else {
          this.kpiService.register(HELP_AUTOSTART_AND_STOP, (this.typeId ? this.typeId + '_' : '') + (this.intro.currentStep() + 1))
        }

        if (this.typeId) {
          localStorage.setItem('INTRO_JS_' + this.typeId, today().getTime().toString())
          this.hasCompleteForm = true
        }
      })
      this.intro.start()
    }, 200)
  }

  close() {}
}
