import { AfterViewInit, Component, Input } from '@angular/core'
import { today } from 'src/app/utils/dates'

declare const introJs: any
declare const window: any

export interface IntroJSStep {
  target: string
  title?: string
  intro?: string
  options?: object
  actions?: object
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
        this.startPlayer()
      }
    }
  }

  startPlayer() {
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
      intro.onbeforechange(() => {
        const currentStep = allStep[intro.currentStep()]
        currentStep.element = document.querySelector(currentStep.target)

        listFunctions.map((f) => {
          window[f] = null
        })
        listFunctions = []
      })
      intro.onexit(() => {
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
