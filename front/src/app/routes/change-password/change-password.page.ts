import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MainClass } from 'src/app/libs/main-class';
import { UserService } from 'src/app/services/user/user.service';

@Component({
  templateUrl: './change-password.page.html',
  styleUrls: ['./change-password.page.scss'],
})
export class ChangePassword extends MainClass implements OnInit, OnDestroy {
  form = new FormGroup({
    email: new FormControl(),
    code: new FormControl(),
    password: new FormControl(),
    passwordConf: new FormControl(),
  });

  constructor(
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    super();
  }

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

  ngOnDestroy() {
    this.watcherDestroy();
  }

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
