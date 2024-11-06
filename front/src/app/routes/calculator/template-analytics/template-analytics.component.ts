import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { GraphsVerticalsLinesComponent } from '../view-analytics/graphs-verticals-lines/graphs-verticals-lines.component';
import { GraphsNumbersComponent } from '../view-analytics/graphs-numbers/graphs-numbers.component';
import { MainClass } from '../../../libs/main-class';
import { ContentieuReferentielInterface } from '../../../interfaces/contentieu-referentiel';
import { OPACITY_20 } from '../../../constants/colors';
import { HumanResourceService } from '../../../services/human-resource/human-resource.service';
import { ReferentielService } from '../../../services/referentiel/referentiel.service';
import { UserService } from '../../../services/user/user.service';

export interface AnalyticsLine {
  title: string;
  description?: string;
  type: string;
  values?: any[][];
  lineMax: number;
  variations: {
    label: string;
    isOption?: boolean;
    values: (number | string | null)[];
    subTitle?: string;
    showArrow?: boolean;
    type?: string;
    dateStart?: Date;
    dateStop?: Date;
    graph?: {
      type: string;
      dateStart: Date;
      dateStop: Date;
      color: string;
    };
  }[];
  optionsVisibles?: boolean;
}

/**
 * Composant de la page en vue analytique
 */

@Component({
  standalone: true,
  imports: [
    CommonModule,
    GraphsVerticalsLinesComponent,
    GraphsNumbersComponent,
  ],
  selector: 'aj-template-analytics',
  templateUrl: './template-analytics.component.html',
  styleUrls: ['./template-analytics.component.scss'],
})
export class TemplateAnalyticsComponent
  extends MainClass
  implements OnInit, OnDestroy
{
  /**
   * Référentiel
   */
  referentiel: ContentieuReferentielInterface[] = [];
  /**
   * Opacité background des contentieux
   */
  OPACITY = OPACITY_20;
  /**
   * Templates
   */
  @Input() lines: AnalyticsLine[] = [];

  /**
   * Constructor
   */
  constructor(
    private humanResourceService: HumanResourceService,
    private referentielService: ReferentielService,
    public userService: UserService
  ) {
    super();
  }

  ngOnInit() {
    this.watch(
      this.humanResourceService.contentieuxReferentiel.subscribe((c) => {
        this.referentiel = c.filter(
          (r) =>
            this.referentielService.idsIndispo.indexOf(r.id) === -1 &&
            this.referentielService.idsSoutien.indexOf(r.id) === -1
        );
      })
    );
  }

  /**
   * Suppresion des observables lors de la suppression du composant
   */
  ngOnDestroy() {
    this.watcherDestroy();
  }

  ngOnChanges() {}

  getOptionsToShow(line: AnalyticsLine) {
    const options = line.variations || [];
    return line.optionsVisibles
      ? options.filter((o) => o.isOption === true || o.isOption === undefined)
      : options.filter((o) => o.isOption === false || o.isOption === undefined);
  }

  hasOption(line: AnalyticsLine) {
    const options = line.variations || [];
    return options.filter((o) => o.isOption === true).length;
  }

  getGraphs(
    line: AnalyticsLine
  ): { type: string; dateStart: Date; dateStop: Date; color: string }[] {
    // @ts-ignore
    return this.getOptionsToShow(line)
      .filter((o) => o.graph)
      .map((o) => o.graph);
  }
}
