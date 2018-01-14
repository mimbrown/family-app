import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { AuthenticationService } from 'app/services/authentication.service';
import { MemberLoginService } from 'app/stores/member-login.service';
import { MemberLogin } from 'app/models/member-login';
import { User } from 'app/user.service';

class Login {
  public username: string = '';
  public password: string = '';
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private members: MemberLogin[];
  private returnUrl: string;
  private password: string;
  // private activeMember: MemberLogin;
  private login: Login = new Login();
  private needsUsername: boolean = false;
  private needsPassword: boolean = false;
  constructor(
    private store: MemberLoginService,
    private router: Router,
    private route: ActivatedRoute,
    private authentication: AuthenticationService,
    private user: User
  ) { }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.store.getData()
      .then(data => this.members = data as MemberLogin[])
  }

  onSubmit(): void {
    let {username, password} = this.login;
    if (username && password) {
      this.authentication.login(username, password)
        .then(response => {
          this.login.password = '';
          this.router.navigate([this.returnUrl]);
        })
        .catch(err => console.error(err));
    } else {
      if (!username) {
        this.needsUsername = true;
      }
      if (!password) {
        this.needsPassword = true;
      }
    }
  }

  // login() {
  //   let password = this.password;
  //   this.password = null;
    
  //   this.authentication.login(this.activeMember.first_name, password)
  //     .then(response => {
  //       this.router.navigate([this.returnUrl]);
  //     })
  //     .catch(err => console.error(err));
  // }

}
