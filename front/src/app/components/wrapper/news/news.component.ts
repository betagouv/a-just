import {
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
} from '@angular/core';
import { MainClass } from '../../../libs/main-class';
import { NewsInterface } from '../../../interfaces/news';
import { NewsService } from '../../../services/news/news.service';
import { UserService } from '../../../services/user/user.service';
import { CommonModule } from '@angular/common';
import { SanitizeHtmlPipe } from '../../../pipes/sanitize-html/sanitize-html.pipe';

/**
 * Composant news qui affiche un panneau de news
 */

@Component({
  selector: 'aj-news',
  standalone: true,
  imports: [CommonModule, SanitizeHtmlPipe],
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
})
export class NewsComponent extends MainClass implements OnInit {
  /**
   * News item
   */
  news: NewsInterface | null = null;
  /**
   * Output pour recharger la page
   */
  @Output() isClosed = new EventEmitter<boolean>(false);
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
    super();
  }

  /**
   * Récupération de la news
   */
  ngOnInit() {
    this.watch(
      this.userService.user.subscribe((u) => {
        this.loadNews();
      })
    );
  }

  /**
   * On force le repaint de la notification pour appliquer la couleur des textes après le 1er rendu
   */
  ngAfterViewInit() {
    requestAnimationFrame(() => {
      const elem = this.el.nativeElement.querySelector('p');
      elem.style.transform = 'translateZ(0)'; //on force le repain de la notification pour appliquer la couleur des textes
    });
  }

  /**
   * Getter pour recuperer la hauteur du composant
   */
  get offsetHeight() {
    return this.el.nativeElement.offsetHeight;
  }

  /**
   * Chargement de la news propre aux utilisateurs connectés
   */
  loadNews() {
    this.newsService.getLast().then((n) => {
      this.news = n;
    });
  }

  /**
   * Close news élement
   */
  onClose() {
    if (this.news) {
      this.newsService.updateNewsOnClick(this.news.id);
      this.news = null;
      this.isClosed.emit(true);
    }
  }
}
