import { Component } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { UserService } from 'src/app/services/user/user.service'

/**
 * Page d'inscription
 */
@Component({
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  /**
   * Formulaire d'inscription
   */
  form = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
    fonction: new FormControl(),
    tj: new FormControl(),
    firstName: new FormControl(),
    lastName: new FormControl(),
    passwordConf: new FormControl(),
    checkbox: new FormControl(),
  })

  /**
   * Constructeur
   * @param userService
   * @param router
   * @param title
   */
  constructor(
    private userService: UserService,
    private router: Router,
    private title: Title
  ) {
    this.title.setTitle('Embarquement | A-Just')
  }

  /**
   * Envoi des informations d'inscriptions
   * @returns
   */
  onSubmit() {
    const {
      email,
      password,
      firstName,
      lastName,
      passwordConf,
      fonction,
      tj,
      checkbox,
    } = this.form.value

    if (!checkbox) {
      alert("Vous devez valider les conditions générales d'utilisation")
      return
    }

    if (!password || password.length < 6) {
      alert("Vous devez saisir un mot de passe d'au moins 6 caractères")
      return
    }

    if (password !== passwordConf) {
      alert('Vos mots de passe ne sont pas identiques')
      return
    }

    this.userService
      .register({ email, password, firstName, lastName, fonction, tj })
      .then((returnLogin) => {
        if (returnLogin) {
          this.router.navigate([
            this.userService.getUserPageUrl(returnLogin.user),
          ])
        } else {
          this.router.navigate(['/login'])
        }
      })
  }
}
