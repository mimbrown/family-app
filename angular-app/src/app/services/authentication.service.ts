import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import 'rxjs/add/operator/map'

import { User } from 'app/user.service';

@Injectable()
export class AuthenticationService {
  private headers = new Headers({ 'Content-Type': 'application/json' });
  constructor(private http: Http, private user: User) { }

  login(username: string, password: string) {
    return this.http.post('/auth', {username: username, password: password }, {headers: this.headers}).toPromise()
      .then(response => {
        let token = response.json().token;
        this.initUser(token);
        localStorage.setItem('user', token);
        // return Promise.resolve(token);
      });
      // .catch(err => console.error(err));
      // .map((response: Response) => {
      //   // login successful if there's a jwt token in the response
      //   let user = response.json();
      //   console.log(user);
      //   if (user && user.token) {
      //     // store user details and jwt token in local storage to keep user logged in between page refreshes
      //     // localStorage.setItem('currentUser', JSON.stringify(user));
      //   }

      //   return user;
      // });
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem('user');
  }

  initUser(token: string): void {
    let user = JSON.parse(window.atob(token.split('.')[1].replace('-', '+').replace('_', '/')));
    this.user.id = user.sub;
    this.user.name = user.name;
    this.user.profile_image = user.profile_image;
  }
}