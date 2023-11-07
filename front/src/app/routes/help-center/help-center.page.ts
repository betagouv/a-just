import { Component } from '@angular/core'

import { GitBookAPI } from '@gitbook/api';
import { DocCardInterface } from 'src/app/components/doc-card/doc-card.component';
import { CALCULATE_DOWNLOAD_URL, DATA_GITBOOK, DOCUMENTATION_URL } from 'src/app/constants/documentation';

/**
 * Contact
 */

@Component({
  templateUrl: './help-center.page.html',
  styleUrls: ['./help-center.page.scss'],
})
export class HelpCenterPage {
  /**
   * Résultat de la recherche GitBook
   */
  data: Array<any> = []
  /**
   * Valeur de rechercher
   */
  searchValue: string = ''
  /**
   * Authentification TOKEN
   */
  token = 'gb_api_rHt5wBv5WBzk2mjUuO2QymdKNpNujdBD8TLfYpsA'
  /**
   * Gitbook API
   */
  gitbook
  /**
   * Focus barre de recherche
   */
  focusOn = false
  /**
   * URL de la nomenclature
   */
  NOMENCLATURE_DOWNLOAD_URL = '/assets/nomenclature-A-Just.html'
  /**
   * Cards documentation
   */
  docCards: Array<DocCardInterface> = [
    {
      tag: 'Documentation',
      title: 'Le guide utilisateur',
      description: 'Retrouvez la présentation des grandes fonctionnalités d’A-JUST que vous soyez débutant ou utilisateur avancé !',
      image: '/assets/images/avatar.svg',
      url: DOCUMENTATION_URL
    },
    {
      tag: 'Documentation',
      title: 'Le data-book',
      description: 'Ce guide détaille la source, et les requêtes permettant la préalimentation de chacune des « données logiciel » de la rubrique « Données d\'activité. ».',
      image: '/assets/images/data-visualization.svg',
      url: DATA_GITBOOK
    },
    {
      tag: 'Documentation',
      title: 'La nomenclature',
      description: 'Vous permet de visualiser globalement et en détail le contenu de chaque contentieux et sous-contentieux. Au civil, vous y retrouverez la liste des NAC prises en compte dans chaque rubrique.',
      image: '/assets/images/system.svg',
      url: this.NOMENCLATURE_DOWNLOAD_URL
    }
  ]
  /**
   * Cards outils
   */
  docTools: Array<DocCardInterface> = [
    {
      tag: 'Les outils A-JUST',
      title: 'La calculatrice de ventilation des ETPT',
      description: '',
      image: '/assets/images/coding.svg',
      url: CALCULATE_DOWNLOAD_URL,
    },
    {
      tag: 'Les outils A-JUST',
      title: 'L’extracteur de données d’effectifs',
      description: '',
      image: '/assets/images/Tableur.svg',
      url: '/dashboard',
      localUrl: true
    },
    {
      tag: 'Les outils A-JUST',
      title: 'L’extracteur de données d’activités',
      description: '',
      image: '/assets/images/Tableur2.svg',
      url: '/dashboard',
      localUrl: true
    }
  ]


  /**
   * Constructeur
   * @param title
   */
  constructor() {
    this.gitbook = new GitBookAPI({
      authToken: this.token,
    });

  }


  async onSearchBy() {
    const { data } = await this.gitbook.search.searchContent({ query: this.searchValue })
    this.data = data.items
    console.log(this.data)
  }

  getDocIcon(title: string) {
    switch (title) {
      case 'Guide d\'utilisateur A-JUST':
        return 'supervised_user_circle'
      case 'FAQ A-JUST':
        return 'question_answer'
      default:
        return 'face'
    }
  }

  goTo(url: string) {
    window.location.href = url;
  }

  isValid(space: string) {
    switch (space) {
      case 'Guide d\'utilisateur A-JUST':
        return true
      case 'Le data-book':
        return true
      default:
        return false
    }
  }

  delay() {
    setTimeout(() => { this.focusOn = false }, 200)
  }
  //AJOUTER CARTE INDIVIDUEL COMPOSANT ET DEMANDER EXPORT MICKAEL
}
