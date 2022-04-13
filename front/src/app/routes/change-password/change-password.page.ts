import { Component } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { UserService } from "src/app/services/user/user.service";

@Component({
  templateUrl: "./change-password.page.html",
  styleUrls: ["./change-password.page.scss"],
})
export class ChangePassword {
  form = new FormGroup({
    email: new FormControl(),
    code: new FormControl(),
    password: new FormControl(),
  });

  constructor(private userService: UserService, private router: Router) {}

  onSubmit() {
    let { email } = this.form.value;
    /*this.userService.forgotPassword({ email }).then((msg) => {
      if(msg) {
        alert(msg);
      }
    });*/
  }
}
