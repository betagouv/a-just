import { Component, inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MainClass } from '../../libs/main-class';
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component';
import { BackButtonComponent } from '../../components/back-button/back-button.component';

/**
 * CGU
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, BackButtonComponent],
  templateUrl: './cgu.page.html',
  styleUrls: ['./cgu.page.scss'],
})
export class CGUPage extends MainClass implements OnInit {
  title = inject(Title);
  route = inject(ActivatedRoute);
  /**
   * Back link
   */
  backLink = '/';
  /**
   * Constructeur
   * @param title
   */
  constructor() {
    super();
    this.title.setTitle("Conditions générales d'utilisation | A-Just");
  }

  /**
   * Au chargement récupération des variables globales + chargement
   */
  ngOnInit() {
    this.watch(
      this.route.params.subscribe((params) => {
        if (params['backPath'] === 'signUp') {
          console.log('PARAM', params['backPath']);
          this.backLink = '/inscription';
        }
      })
    );
  }
}
