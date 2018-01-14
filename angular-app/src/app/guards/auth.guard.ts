import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { User } from 'app/user.service';
import { AuthenticationService } from 'app/services/authentication.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private router: Router, private user: User, private authentication: AuthenticationService) { }
  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    let token = localStorage.getItem('user');
    if (token) {
      this.authentication.initUser(token);
      return true;
    }
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url }});
    return false;
  }
}
