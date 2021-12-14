import { Component } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { AuthService } from "src/app/services/auth/auth.service";
import { UserService } from "src/app/services/user/user.service";

@Component({
  templateUrl: "./login.page.html",
  styleUrls: ["./login.page.scss"],
})
export class LoginPage {
  form = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
  });

  constructor(private authService: AuthService, private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.userService.me().then((data) => {
      if (data) {
        this.router.navigate(["/dashboard"]);
      }
    });
  }

  onSubmit() {
    let { email, password } = this.form.value;
    this.authService.login({ email, password }).then(() => {
      this.router.navigate(["/dashboard"]);
    });
  }
}
