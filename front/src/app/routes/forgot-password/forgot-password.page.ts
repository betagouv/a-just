import { Component } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { UserService } from "src/app/services/user/user.service";

/**
 * Page de demande de nouveau mot de passe
 */

@Component({
  templateUrl: "./forgot-password.page.html",
  styleUrls: ["./forgot-password.page.scss"],
})
export class ForgotPassword {
  /**
   * Formulaire
   */
  form = new FormGroup({
    email: new FormControl(),
  });
  /**
   * Popin de confirmation
   */
  openPopin = false

  /**
   * Constructeur
   * @param userService 
   * @param router 
   */
  constructor(private userService: UserService, private router: Router) { }

  /**
   * Demande de génération d'un code de changement de mot de passe
   */
  onSubmit() {
    let { email } = this.form.value;
    this.userService.forgotPassword({ email }).then((msg) => {
      if (msg) {
        this.openPopin = true
      }
    })
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
    let { email } = this.form.value;
    return email ? email : null
  }
}
