import { Component, OnInit } from '@angular/core'
import { NewsInterface } from 'src/app/interfaces/news'
import { MainClass } from 'src/app/libs/main-class'
import { NewsService } from 'src/app/services/news/news.service'
import { UserService } from 'src/app/services/user/user.service'

/**
 * Composant news qui affiche un panneau de news
 */

@Component({
  selector: 'aj-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent extends MainClass implements OnInit {
  /**
   * News item
   */
  news: NewsInterface | null = null

  /**
   * Constructeur
   * @param newsService
   * @param userService
   */
  constructor(
    private newsService: NewsService,
    private userService: UserService
  ) {
    super()
  }

  /**
   * Récupération de la news
   */
  ngOnInit() {
    this.watch(
      this.userService.user.subscribe((u) => {
        this.loadNews()
      })
    )
  }

  /**
   * Chargement de la news propre aux utilisateurs connectés
   */
  loadNews() {
    this.newsService.getLast().then((n) => {
      console.log(n)
      this.news = n
    })
  }

  /**
   * Close news élement
   */
  onClose() {
    if (this.news) {
      this.newsService.updateNewsOnClick(this.news.id)
      this.news = null
    }
  }
}
