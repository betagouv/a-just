import { Component } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { Title } from '@angular/platform-browser'
import { Router } from '@angular/router'
import { UserService } from 'src/app/services/user/user.service'

@Component({
  templateUrl: './about-us.page.html',
  styleUrls: ['./about-us.page.scss'],
})
export class AboutUsPage {
  form = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
    fonction: new FormControl(),
    tj: new FormControl(),
    firstName: new FormControl(),
    lastName: new FormControl(),
    passwordConf: new FormControl(),
  })

  constructor(private userService: UserService, private router: Router, private title: Title) {
    this.title.setTitle('Qui sommes-nous ? | A-Just')
  }

  ngOnInit() {}

  onSubmit() {
    const { email, password, firstName, lastName, passwordConf, fonction, tj } =
      this.form.value

    if (password.length < 6) {
      alert("Vous devez saisir un mot de passe d'au moins 6 caractères")
      return
    }

    if (password !== passwordConf) {
      alert('Vos mots de passe ne sont pas identiques')
      return
    }

    this.userService
      .register({ email, password, firstName, lastName, fonction, tj })
      .then(() => {
        alert(
          "Merci de votre inscription. L'équipe A-JUST vous avertira dès que les droits vous auront été attribués"
        )
        this.router.navigate(['/login'])
      })
  }
}