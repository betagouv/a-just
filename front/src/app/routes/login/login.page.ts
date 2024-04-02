import { AfterViewInit, Component, OnInit } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { LOGIN_STATUS_GET_CODE } from 'src/app/constants/login'
import {
  PROVIDER_JUSTICE_NAME,
  SAML_STATUS_PENDING,
} from 'src/app/constants/saml'
import { AuthService } from 'src/app/services/auth/auth.service'
import { SSOService } from 'src/app/services/sso/sso.service'
import { UserService } from 'src/app/services/user/user.service'
import { environment } from 'src/environments/environment'

declare const introJs: any

/**
 * Page de connexion
 */

@Component({
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit, AfterViewInit {
  /**
   * SSO is activate to this env
   */
  ssoIsActivate: boolean = environment.enableSSO
  /**
   * Error connection message on login
   */
  errorMessage: string | null = null
  /**
   * Can user SSO
   */
  canUseSSO: boolean = true
  /**
   * Formulaire
   */
  form = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
    remember: new FormControl(),
  })
  /**
   * Waiting screen to be ready
   */
  isReady: boolean = false
  /**
   * Popin to required code
   */
  needToGetCode: string | null = null

  /**
   * Constructeur
   * @param authService
   * @param userService
   * @param router
   * @param title
   */
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router,
    private title: Title,
    private ssoService: SSOService
  ) {
    this.title.setTitle('Se connecter | A-Just')
  }

  /**
   * Vérificiation si l'utilisateur est connecté
   */
  ngOnInit() {
    if (this.ssoIsActivate) {
      //this.ssoService.canUseSSO().then((d) => (this.canUseSSO = d))
    }

    this.userService.me().then((data) => {
      if (data) {
        this.router.navigate([this.userService.getUserPageUrl(data)])
      }
    })

    this.ssoService.getSSOStatus().then((s) => {
      console.log(s)
      this.isReady = true
      if (s.token) {
        this.router.navigate([this.userService.getUserPageUrl(s.user)])
        return
      }
      if (s && s && s.status === SAML_STATUS_PENDING) {
        // we need to complete to signin
        this.router.navigate(['/inscription'], {
          queryParams: {
            email: s.datas.email,
            firstName: s.datas.firstName,
            lastName: s.datas.lastName,
            provider: PROVIDER_JUSTICE_NAME,
          },
        })
      }
    })
  }

  ngAfterViewInit(): void {
    /*setTimeout(() => {
      introJs().setOptions({
        steps: [{
          element: document.querySelector('.intro-step-1'),
          title: 'Welcome',
          intro: 'Hello World! 👋'
        },
        {
          element: document.querySelector('.intro-step-2'),
          intro: '<img src="https://i.giphy.com/media/ujUdrdpX7Ok5W/giphy.webp" onerror="this.onerror=null;this.src=\'https://i.giphy.com/ujUdrdpX7Ok5W.gif\';" alt="">'
        },
        {
          element: document.querySelector('.intro-step-3'),
          intro: '<iframe src="https://player.vimeo.com/video/788716513?h=fbc50474c2" width="600" height="360" frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe><p><a href="https://vimeo.com/788716513">2 - A-JUST : pr&eacute;sentation de l&#039;outil</a> from <a href="https://vimeo.com/user192349426">Aurelie Pretat</a> on <a href="https://vimeo.com">Vimeo</a>.</p>'
        }]
      }).start();
  }, 2000)*/
  }

  /**
   * Demande connexion
   */
  onSubmit() {
    let { email, password, remember } = this.form.value
    this.errorMessage = null
    this.authService
      .login({ email, password, remember: Number(remember) }, { noAlert: true })
      .then((returnLogin) => {
        if (
          returnLogin &&
          returnLogin.data &&
          returnLogin.data.status === LOGIN_STATUS_GET_CODE
        ) {
          this.needToGetCode = returnLogin.data.datas.code || ''
        } else {
          this.router.navigate([
            this.userService.getUserPageUrl(returnLogin.user),
          ])
        }
      })
      .catch((err) => {
        this.errorMessage = err
      })
  }

  onUseSSO() {
    //if (!this.canUseSSO) {
    //  alert(
    //    "Vous devez être dans l'environement Justice pour utiliser page blanche !"
    //  )
    //} else {
    window.location.href = this.ssoService.getSSOLogin()
    //}
  }

  onContinuToLogin(action: any, input: any) {
    console.log(action, input.value)
    switch (action.id) {
      case 'connect':
        this.authService
          .completeLogin({ code: input.value })
          .then((returnLogin) => {
            this.router.navigate([
              this.userService.getUserPageUrl(returnLogin.user),
            ])
          })
        break
      default:
        this.needToGetCode = null
        break
    }
  }
}
