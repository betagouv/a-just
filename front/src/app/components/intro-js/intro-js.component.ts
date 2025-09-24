
import {
  AfterViewInit,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
} from '@angular/core';
import { KPIService } from '../../services/kpi/kpi.service';
import {
  HELP_AUTOSTART,
  HELP_AUTOSTART_AND_STOP,
  HELP_START,
  HELP_STOP,
} from '../../constants/log-codes';
import { today } from '../../utils/dates';

declare const introJs: any;
declare const window: any;

export interface IntroJSStep {
  target: string;
  title?: string;
  intro?: string;
  options?: object;
  actions?: object;
  beforeLoad?: Function;
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
  standalone: true,
  imports: [],
  templateUrl: './intro-js.component.html',
  styleUrls: ['./intro-js.component.scss'],
})
export class IntroJSComponent implements AfterViewInit {
  kpiService = inject(KPIService);
  /**
   * Etapes d'intros text dans l'alerte
   */
  @Input() steps: IntroJSStep[] = [];
  /**
   * Identifiant unique
   */
  @Input() typeId: string | undefined;
  /**
   * Rejouer systématiquement
   */
  @Input() playEachTime: boolean = false;
  /**
   * Event de fin du tour
   */
  @Output() close = new EventEmitter();
  /**
   * has complete form
   */
  hasCompleteForm: boolean = false;
  /**
   * Intro JS instance
   */
  intro: any;

  nodeEnv = import.meta.env.NG_APP_NODE_ENV;

  @HostListener('window:popstate', ['$event'])
  onPopState() {
    if (this.intro) {
      this.intro.exit();
    }
  }

  ngAfterViewInit(): void {
    if (this.steps && this.nodeEnv !== 'test') {
      let canStartPlayer = true;
      if (this.typeId && this.playEachTime === false) {
        const idUsed = localStorage.getItem('INTRO_JS_' + this.typeId);
        if (idUsed) {
          this.hasCompleteForm = true;
          canStartPlayer = false;
        }
      }

      if (canStartPlayer) {
        this.startPlayer(false);
      }
    }
  }

  startPlayer(log = true) {
    if (log) {
      this.kpiService.register(HELP_START, '');
    } else {
      this.kpiService.register(HELP_AUTOSTART, '');
    }

    setTimeout(() => {
      this.hasCompleteForm = false;

      let listFunctions: string[] = [];
      const formatActionsToHtml = (actions: any) => {
        actions = actions || {};
        let html = '';
        let allActions = Object.keys(actions).filter(
          (a) => actions[a].enable === 'undefined' || actions[a].enable === true
        );
        if (allActions.length) {
          html += '<div class="intro-js-action">';
          allActions.map((key) => {
            // ne fonctionne pas a cause du CSP
            html += `<button onclick="window.INTROJS_AJ_${key}()">${actions[key].label}</button>`;
          });

          html += '';
        }

        return html;
      };

      const allStep = this.steps.map((s) => {
        return {
          ...s,
          element: document.querySelector(s.target),
          intro: (s.intro || '') + formatActionsToHtml(s.actions),
          ...(s.options || {}),
        };
      });
      this.intro = introJs().setOptions({
        nextLabel: 'Suivant',
        prevLabel: 'Précédent',
        doneLabel: 'Terminer la présentation',
        steps: allStep,
      });
      this.intro.onchange(() => {
        const currentStep = allStep[this.intro.currentStep()];

        if (currentStep.actions) {
          Object.keys(currentStep.actions).map((key) => {
            window['INTROJS_AJ_' + key] = () => {
              // @ts-ignore
              currentStep.actions[key].call.apply(null, arguments);
              this.intro.exit();
            };
            listFunctions.push('INTROJS_AJ_' + key);
          });
        }
      });
      this.intro.onbeforechange(async () => {
        const currentStep = allStep[this.intro.currentStep()];
        currentStep.element = document.querySelector(currentStep.target);

        let interval = setInterval(() => {
          const introTooltip: any = document.querySelector('.introjs-tooltip');
          if (introTooltip) {
            clearInterval(interval);
            introTooltip.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 600);

        if (currentStep.beforeLoad) {
          await currentStep.beforeLoad(this.intro);
        }

        const domElement = document.querySelector(currentStep.target);
        if (domElement) {
          this.intro._introItems[this.intro.currentStep()].element = domElement;
          this.intro.refresh(); // NE MARCHE PAS !!!!
        }

        listFunctions.map((f) => {
          window[f] = null;
        });
        listFunctions = [];
      });
      this.intro.onexit(() => {
        console.log('on close');
        this.close.emit();

        if (log) {
          this.kpiService.register(
            HELP_STOP,
            (this.typeId ? this.typeId + '_' : '') +
              (this.intro.currentStep() + 1)
          );
        } else {
          this.kpiService.register(
            HELP_AUTOSTART_AND_STOP,
            (this.typeId ? this.typeId + '_' : '') +
              (this.intro.currentStep() + 1)
          );
        }

        if (this.typeId) {
          localStorage.setItem(
            'INTRO_JS_' + this.typeId,
            today().getTime() + ''
          );
          this.hasCompleteForm = true;
        }
      });
      this.intro.start();
    }, 200);
  }
}
