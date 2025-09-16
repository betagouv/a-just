import { Component, inject } from '@angular/core'
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { WrapperNoConnectedComponent } from '../../components/wrapper-no-connected/wrapper-no-connected.component'
import { PopupComponent } from '../../components/popup/popup.component'
import { UserService } from '../../services/user/user.service'

/**
 * Page de demande de nouveau mot de passe
 */

@Component({
  standalone: true,
  imports: [FormsModule, WrapperNoConnectedComponent, PopupComponent, RouterLink, ReactiveFormsModule],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
})
export class ForgotPassword {
  /**
   * Service de gestion de l'utilisateur
   */
  userService = inject(UserService)
  /**
   * Service de navigation
   */
  router = inject(Router)
  /**
   * Formulaire
   */
  form = new FormGroup({
    email: new FormControl(),
  })
  /**
   * Popin de confirmation
   */
  openPopin = false

  /**
   * Demande de génération d'un code de changement de mot de passe
   */
  onSubmit() {
    let { email } = this.form.value

    if (import.meta.env.NG_APP_NODE_ENV === 'test') {
      this.userService.forgotPasswordTest({ email }).then((res) => {
        if (res.msg) {
          this.openPopin = true
        }
      })
    } else {
      this.userService.forgotPassword({ email }).then((msg) => {
        if (msg) {
          this.openPopin = true
        }
      })
    }
  }

  /**
   * Retour à la page login
   */
  onClosePopin() {
    this.router.navigate(['/login'])
  }

  /**
   * Renvoi le mail saisi par l'utilisateur
   * @returns
   */
  getEmail() {
    let { email } = this.form.value
    return email ? email : null
  }
}
