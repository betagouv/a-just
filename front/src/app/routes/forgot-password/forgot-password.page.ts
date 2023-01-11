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
   * Constructeur
   * @param userService 
   * @param router 
   */
  constructor(private userService: UserService, private router: Router) {}

  /**
   * Demande de génération d'un code de changement de mot de passe
   */
  onSubmit() {
    let { email } = this.form.value;
    this.userService.forgotPassword({ email }).then((msg) => {
      if(msg) {
        alert(msg);
        this.router.navigate(['/login']);
      }
    });
  }
}
