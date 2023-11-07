import { Component } from '@angular/core'

import { GitBookAPI } from '@gitbook/api';

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
}
