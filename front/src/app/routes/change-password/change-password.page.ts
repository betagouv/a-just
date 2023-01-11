import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MainClass } from 'src/app/libs/main-class';
import { UserService } from 'src/app/services/user/user.service';

/**
 * Page changement du mot de passe
 */

@Component({
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePassword extends MainClass implements OnInit, OnDestroy {
  /**
   * Formulaire
   */
  form = new FormGroup({
    email: new FormControl(),
    code: new FormControl(),
    password: new FormControl(),
    passwordConf: new FormControl(),
  });

  /**
   * Constructeur
   * @param userService 
   * @param route 
   * @param router 
   */
  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    super();
  }

  /**
   * On écoute le changement du code dans l'url
   */
  ngOnInit() {
    this.watch(
      this.route.queryParams
        .subscribe((params) => {
          if(params.p) {
            this.form.get('code')?.setValue(params.p);
          }
        })
    );
  }

  /**
   * On détruit les observables
   */
  ngOnDestroy() {
    this.watcherDestroy();
  }

  /** 
   * Envoi du nouveau mot de passe au serveur
   */
  onSubmit() {
    const { email, code, password, passwordConf } =
      this.form.value;

    if (!password || password.length < 6) {
      alert("Vous devez saisir un mot de passe d'au moins 6 caractères");
      return;
    }

    if(password !== passwordConf) {
      alert("Vos mots de passe ne sont pas identiques");
      return;
    }

    this.userService.changePassword({ email, code, password }).then((result) => {
      if(result.msg) {
        alert(result.msg);

        if(result.status) {
          this.router.navigate(["/login"]);
        }
      }
    });
  }
}
