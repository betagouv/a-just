import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage {
  form = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
    firstName: new FormControl(),
    lastName: new FormControl(),
    passwordConf: new FormControl(),
  });

  constructor(
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {}

  onSubmit() {
    const { email, password, firstName, lastName, passwordConf } =
      this.form.value;

    if (password.length < 6) {
      alert("Vous devez saisir un mot de passe d'au moins 6 caractères");
      return;
    }

    if(password !== passwordConf) {
      alert("Vos mots de passe ne sont pas identiques");
      return;
    }

    this.userService.register({ email, password, firstName, lastName }).then(() => {
      alert('Félicitation ! Votre compte est maintenant crée. Veuillez vous rapprocher de l\'équipe A-Just pour avoir accès à votre juridiction')
      this.router.navigate(['/login']);
    });
  }
}
