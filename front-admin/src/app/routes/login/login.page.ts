import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/user/user.service';
import { LOGIN_STATUS_GET_CODE } from '../../constants/login';
import { PopupComponent } from '../../components/popup/popup.component';


@Component({
  standalone: true,
  imports: [
    PopupComponent,
    FormsModule,
    ReactiveFormsModule,
    PopupComponent
],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  form = new FormGroup({
    email: new FormControl(),
    password: new FormControl(),
  });
  /**
   * Popin to required code
   */
  needToGetCode: string | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.me().then((data) => {
      if (data) {
        this.router.navigate(['/users']);
      }
    });
  }

  onSubmit() {
    let { email, password } = this.form.value;
    this.authService.loginAdmin({ email, password }).then((returnLogin) => {
      if (
        returnLogin &&
        returnLogin.data &&
        returnLogin.data.status === LOGIN_STATUS_GET_CODE
      ) {
        this.needToGetCode = returnLogin.data.datas.code || '';
      } else {
        this.router.navigate(['/users']);
      }
    });
  }

  onContinuToLogin(action: any, input: any) {
    console.log(action, input.value);
    switch (action.id) {
      case 'connect':
        this.authService
          .completeLogin({ code: input.value })
          .then((returnLogin) => {
            this.router.navigate(['/users']);
          });
        break;
      default:
        this.needToGetCode = null;
        break;
    }
  }
}
