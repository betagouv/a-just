import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core'
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
   * Output pour recharger la page
   */
  @Output() isClosed = new EventEmitter<boolean>(false)
  /**
   * Constructeur
   * @param newsService
   * @param userService
   */
  constructor(
    private newsService: NewsService,
    private userService: UserService,
    private el: ElementRef
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
   * Getter pour recuperer la hauteur du composant
   */
  get offsetHeight() {
    return this.el.nativeElement.offsetHeight
  }

  /**
   * Chargement de la news propre aux utilisateurs connectés
   */
  loadNews() {
    this.newsService.getLast().then((n) => {
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
      this.isClosed.emit(true)
    }
  }
}
