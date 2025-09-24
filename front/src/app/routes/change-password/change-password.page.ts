import { Component, inject, OnDestroy, OnInit } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { MainClass } from '../../libs/main-class'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { UserService } from '../../services/user/user.service'
import { CommonModule } from '@angular/common'
import { MIN_PASSWORD_LENGTH } from '../../utils/user'

/**
 * Page changement du mot de passe
 */

@Component({
  standalone: true,
  imports: [WrapperNoConnectedComponent, FormsModule, RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePassword extends MainClass implements OnInit, OnDestroy {
  userService = inject(UserService)
  route = inject(ActivatedRoute)
  router = inject(Router)
  MIN_PASSWORD_LENGTH = MIN_PASSWORD_LENGTH

  /**
   * Formulaire
   */
  form = new FormGroup({
    email: new FormControl(),
    code: new FormControl(),
    password: new FormControl(),
    passwordConf: new FormControl(),
    checkboxPassword: new FormControl(),
  })
  /**
   * Mot de passe paramètres de validation
   */
  passwordStrength = {
    length: false,
    char: false,
    number: false,
    majuscule: false,
  }

  /**
   * Constructeur
   * @param userService
   * @param route
   * @param router
   */
  constructor() {
    super()
  }

  /**
   * On écoute le changement du code dans l'url
   */
  ngOnInit() {
    this.watch(
      this.route.queryParams.subscribe((params) => {
        if (params['p']) {
          this.form.get('code')?.setValue(params['p'])
        }
      }),
    )
  }

  /**
   * On détruit les observables
   */
  ngOnDestroy() {
    this.watcherDestroy()
  }

  /**
   * Envoi du nouveau mot de passe au serveur
   */
  onSubmit() {
    const { email, code, password, passwordConf } = this.form.value
    var arrayOfSp = ['!', '@', '#', '$', '%', '&', '*', '_', '?', '-']
    var regex = '[' + arrayOfSp.join('') + ']'

    if (!password || password.length < MIN_PASSWORD_LENGTH || !password.match(/\d/) || !new RegExp(regex).test(password) || !password.match(/[A-Z]/g)) {
      alert('Vous devez saisir un mot de passe qui remplit les critères obligatoires')
      return
    }

    if (password !== passwordConf) {
      alert('Vos mots de passe ne sont pas identiques')
      return
    }

    if ((email || '').length === 0) {
      alert('Vous devez saisir votre email')
      return
    }

    this.userService.changePassword({ email, code, password }).then((result) => {
      if (result.msg) {
        alert(result.msg)

        if (result.status) {
          this.router.navigate(['/login'])
        }
      }
    })
  }

  /**
   * Vérifie la robustesse du mot de passe
   * @param event
   */
  checkStrength(event: any) {
    const password = event.target.value

    if (password && password.match(/\d/)) {
      this.passwordStrength.number = true
    } else this.passwordStrength.number = false

    var arrayOfSp = ['!', '@', '#', '$', '%', '&', '*', '_', '?', '-']
    var regex = '[' + arrayOfSp.join('') + ']'
    if (password && new RegExp(regex).test(password)) {
      this.passwordStrength.char = true
    } else this.passwordStrength.char = false

    if (password && password.length > MIN_PASSWORD_LENGTH) {
      this.passwordStrength.length = true
    } else this.passwordStrength.length = false

    if (password && password.match(/[A-Z]/g)) {
      this.passwordStrength.majuscule = true
    } else this.passwordStrength.majuscule = false
  }

  /**
   * Retourne la couleur des différents éléments de validation de mot de passe
   * @param val
   * @returns
   */
  getParamColor(val: number) {
    const password = this.form.get('password')?.value
    const options = ['length', 'char', 'number', 'majuscule']

    if (!password) return '#0063cb'
    // @ts-ignore
    else if (this.passwordStrength[options[val]] === false) return 'red'
    else return '#0063cb'
  }
}
