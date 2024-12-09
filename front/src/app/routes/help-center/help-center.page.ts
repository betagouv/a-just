import { AfterViewInit, Component, inject, OnInit } from '@angular/core';
import { GitBookAPI } from '@gitbook/api';
import { WrapperComponent } from '../../components/wrapper/wrapper.component';
import { CommonModule } from '@angular/common';
import { InputButtonComponent } from '../../components/input-button/input-button.component';
import { DocCardInterface } from '../../components/doc-card/doc-card.component';
import {
  CALCULATE_DOWNLOAD_URL,
  DATA_GITBOOK,
  DOCUMENTATION_URL,
  DOCUMENTATION_URL_CA,
  NOMENCLATURE_DOWNLOAD_URL,
  NOMENCLATURE_DOWNLOAD_URL_CA,
} from '../../constants/documentation';
import { UserService } from '../../services/user/user.service';
import { ServerService } from '../../services/http-server/server.service';
import { AppService } from '../../services/app/app.service';
import { environment } from '../../../environments/environment';
import { downloadFile } from '../../utils/system';
import { MatIconModule } from '@angular/material/icon';
import { SanitizeResourceUrlPipe } from '../../pipes/sanitize-resource-url/sanitize-resource-url.pipe';
import { BackButtonComponent } from '../../components/back-button/back-button.component';
import { FormsModule } from '@angular/forms';

interface webinaire {
  img: string;
  title: string;
  content: string;
  action: string[];
  rank: number;
}
/**
 * Contact
 */

@Component({
  standalone: true,
  imports: [
    WrapperComponent,
    CommonModule,
    InputButtonComponent,
    MatIconModule,
    SanitizeResourceUrlPipe,
    BackButtonComponent,
    FormsModule,
  ],
  templateUrl: './help-center.page.html',
  styleUrls: ['./help-center.page.scss'],
})
export class HelpCenterPage implements OnInit, AfterViewInit {
  userService = inject(UserService);
  serverService = inject(ServerService);
  appService = inject(AppService);
  /**
   * Résultat de la recherche GitBook
   */
  data: Array<any> = [];
  /**
   * Valeur de rechercher
   */
  searchValue: string = '';
  /**
   * Gitbook API
   */
  gitbook;
  /**
   * Focus barre de recherche
   */
  focusOn = false;
  /**
   * URL de la nomenclature
   */
  NOMENCLATURE_DOWNLOAD_URL = '/assets/nomenclature-A-Just.html';
  /**
   * GitBook Token
   */
  gitToken;
  /** Carte guide utilisateur */
  userGuide = {
    tag: 'Documentation',
    title: 'Le guide utilisateur',
    description:
      'Retrouvez la présentation des grandes fonctionnalités d’A-JUST que vous soyez débutant ou utilisateur avancé!',
    image: '/assets/images/avatar.svg',
    url: this.userService.isCa() ? DOCUMENTATION_URL_CA : DOCUMENTATION_URL,
  };
  /** Carte data book */
  dataBook = {
    tag: 'Documentation',
    title: 'Le data-book',
    description:
      "Ce guide détaille la source, et les requêtes permettant la préalimentation de chacune des « données logiciel » de la rubrique « Données d'activité».",
    image: '/assets/images/data-visualization.svg',
    url: DATA_GITBOOK,
  };
  /** Carte nomenclature */
  nomenclature = {
    tag: 'Documentation',
    title: 'La nomenclature',
    description:
      'Vous permet de visualiser globalement et en détail le contenu de chaque contentieux et sous-contentieux. Au civil, vous y retrouverez la liste des NAC prises en compte dans chaque rubrique.',
    image: '/assets/images/system.svg',
    url: this.userService.isCa()
      ? NOMENCLATURE_DOWNLOAD_URL_CA
      : NOMENCLATURE_DOWNLOAD_URL,
    localUrl: false,
    download: true,
  };
  /**
   * Cards documentation
   */
  docCards: Array<DocCardInterface> = [
    this.userGuide,
    this.dataBook,
    this.nomenclature,
  ];
  /**
   * Cards outils
   */
  docTools: Array<DocCardInterface> = [
    this.nomenclature,
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
      localUrl: true,
    },
    {
      tag: 'Les outils A-JUST',
      title: 'L’extracteur de données d’activité',
      description: '',
      image: '/assets/images/Tableur2.svg',
      url: '/dashboard',
      localUrl: true,
    },
  ];
  /**
   * webinaire
   */
  webinaires: Array<webinaire> | null = null;

  /**
   * Ouverture d'un iframe gitbook embeded
   */
  openSuggestionPanel = false;
  /**
   * Ouverture de popin d appel
   */
  popinCall = false;
  /**
   * Appel demandé
   */
  callValidated = false;
  /**
   * Doc à afficher dans une IFRAME
   */
  openToIframe = { url: '', title: '' };
  /**
   * Liens vers la doc
   */
  documentation = [
    {
      url: 'https://docs.a-just.beta.gouv.fr/tout-savoir-en-un-coup-doeil/',
      title: "Tout savoir en un coup d'oeil",
      color: 'blue',
    },
    {
      url: 'https://docs.a-just.beta.gouv.fr/prenez-en-main-votre-espace/',
      title: 'Prenez en main votre espace',
      color: 'green',
    },
    {
      url: 'https://docs.a-just.beta.gouv.fr/pilotez-votre-juridiction/',
      title: 'Pilotez votre juridiction',
      color: 'red',
    },
    {
      url: 'https://docs.a-just.beta.gouv.fr/cas-dusage/',
      title: 'Cas d’usage',
      color: 'yellow',
    },
  ];
  /**
   * Cle date pour usage unique
   */
  cleDate = '?date=' + new Date();

  /**
   * GITBOOK ID
   */
  gitbookId = import.meta.env.NG_APP_GITBOOK_ID;

  /**
   * Constructeur
   */
  constructor() {
    this.gitToken = import.meta.env.NG_APP_GITBOOK_TOKEN;
    this.gitbook = new GitBookAPI({
      authToken: this.gitToken,
    });
    this.sendLog();
  }

  ngOnInit() {
    if (this.userService.isCa())
      this.docTools = [
        this.nomenclature,
        {
          tag: 'Les outils A-JUST',
          title: 'La calculatrice de ventilation des ETPT',
          description: '',
          image: '/assets/images/coding.svg',
          url: CALCULATE_DOWNLOAD_URL,
        },
      ];
    this.loadWebinaires();
  }
  ngAfterViewInit(): void {
    window.addEventListener('click', this.onClick.bind(this));
  }

  onClick(e: any) {
    if (document.getElementById('help-center')?.contains(e.target)) {
      this.popinCall = false;
    }
  }

  async onSearchBy() {
    const { data } = await this.gitbook.search.searchContent({
      query: this.searchValue,
    });
    this.data = data.items;
  }

  getDocIcon(title: string) {
    switch (title) {
      //case "Guide d'utilisateur A-JUST CA":
      //return 'supervised_user_circle'
      case "Guide d'utilisateur A-JUST":
        return 'supervised_user_circle';
      case 'FAQ A-JUST':
        return 'question_answer';
      default:
        return 'face';
    }
  }

  async goTo(researchRes: any, title: string) {
    await this.serverService
      .post('centre-d-aide/log-documentation-link', {
        value: researchRes.urls.app,
      })
      .then((r) => {
        return r.data;
      });
    await this.serverService
      .post('centre-d-aide/log-documentation-recherche', {
        value: this.searchValue,
      })
      .then((r) => {
        return r.data;
      });

    switch (title) {
      case "Guide d'utilisateur A-JUST CA":
        window.open(
          'https://docs.a-just.beta.gouv.fr/guide-dutilisateur-a-just-ca/' +
            researchRes.path
        );
        break;
      case "Guide d'utilisateur A-JUST":
        window.open(
          'https://docs.a-just.beta.gouv.fr/documentation-deploiement/' +
            researchRes.path
        );
        break;
      case 'Le data-book':
        window.open(
          'https://docs.a-just.beta.gouv.fr/le-data-book/' + researchRes.path
        );
        break;
      default:
        break;
    }
  }

  isValid(space: string) {
    if (this.userService.isCa()) {
      //console.log('OK')
      switch (space) {
        case "Guide d'utilisateur A-JUST CA":
          //console.log('isValid OK')
          return true;
        default:
          //console.log('isValid NOT OK')
          return false;
      }
    } else {
      //console.log('NOT OK')
      switch (space) {
        case "Guide d'utilisateur A-JUST":
          return true;
        case 'Le data-book':
          return true;
        default:
          return false;
      }
    }
  }

  /**
   * Temporiser le focus d'un input
   */
  delay() {
    setTimeout(() => {
      this.focusOn = false;
    }, 200);
  }

  /**
   * Envoie de log
   */
  async sendLog() {
    await this.serverService
      .post('centre-d-aide/log-documentation')
      .then((r) => {
        return r.data;
      });
  }

  async sendForm(phoneNumber: string) {
    let userId = this.userService.user.getValue()?.id || null;
    if (userId)
      await this.serverService
        .post('centre-d-aide/post-form-hubspot', {
          userId,
          phoneNumber,
        })
        .then((r) => {
          return r.data;
        });
  }

  async goToLink(url: string, download = false) {
    await this.serverService
      .post('centre-d-aide/log-documentation-link', {
        value: url,
      })
      .then((r) => {
        return r.data;
      });
    if (CALCULATE_DOWNLOAD_URL === url)
      this.appService.alert.next({
        text: "Le téléchargement va démarrer : cette opération peut, selon votre ordinateur, prendre plusieurs secondes. Merci de patienter jusqu'à l'ouverture de votre fenêtre de téléchargement.",
      });

    if (url === '/dashboard') window.location.href = url;
    else {
      if (download) {
        downloadFile(url);
      } else {
        window.open(url);
      }
    }
  }

  openLink(url: string) {
    window.open(url, '_blank');
  }

  async loadWebinaires() {
    this.webinaires = new Array();
    const { data } = await this.gitbook.spaces.getPageByPath(
      this.gitbookId,
      'accueil/'
    );

    await Promise.all(
      data.pages.map(async (page, index) => {
        const { data } = (await this.gitbook.spaces.getPageById(
          this.gitbookId,
          page.id
        )) as any;
        try {
          let webinaire = {
            img: data.document?.nodes[0].data.url,
            title: data.title,
            content: data.document?.nodes[1].nodes[0].leaves[0].text,
            action: [
              data.document.nodes[2].data.url || null,
              data.document.nodes[3]?.data.url || null,
            ],
            rank: index,
          };
          if (data.title.includes('[CACHER]') === false)
            this.webinaires?.push(webinaire);
        } catch (error) {
          console.log(
            "Le format du webinaire gitbook n'est pas conforme",
            data
          );
        }
      })
    ).then(() => {
      this.webinaires?.sort((a, b) => a.rank - b.rank);
      console.log(this.webinaires);
    });
  }

  validateNo(e: any) {
    const charCode = e.which ? e.which : e.keyCode;
    if (charCode === 46) return true;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

  getIframeUrl() {
    return this.openToIframe.url;
  }

  reloadContent() {
    this.openSuggestionPanel = !this.openSuggestionPanel;
  }
  getDocKeys(): Array<any> {
    return Object.keys(this.documentation);
  }
}
