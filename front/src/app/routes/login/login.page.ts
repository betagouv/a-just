import { Component } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { AuthService } from 'src/app/services/auth/auth.service'
import { SSOService } from 'src/app/services/sso/sso.service'
import { UserService } from 'src/app/services/user/user.service'

/**
 * Page de connexion
 */

@Component({
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  /**
   * Error connection message on login
   */
  errorMessage: string | null = null
  /**
   * Can user SSO
   */
  canUseSSO: boolean = false
  /**
   * Formulaire
   */
  form = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
    remember: new FormControl()
  })

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
    private ssoService: SSOService,
  ) {
    this.title.setTitle('Se connecter | A-Just')
  }

  /**
   * Vérificiation si l'utilisateur est connecté
   */
  ngOnInit() {
    this.ssoService.canUseSSO().then(d => this.canUseSSO = d)

    this.userService.me().then((data) => {
      if (data) {
        this.router.navigate([this.userService.getUserPageUrl(data)])
      }
    })
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
        this.router.navigate([
          this.userService.getUserPageUrl(returnLogin.user),
        ])
      })
      .catch((err) => {
        this.errorMessage = err
      })
  }

  onUseSSO() {
    if(!this.canUseSSO) {
      alert('Vous devez être dans l\'environement Justice pour utiliser page blanche !')
    }

    window.location.href = this.ssoService.getSSOLogin()
  }
}
