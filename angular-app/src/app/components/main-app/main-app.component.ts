import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { User } from 'app/user.service';
import { AuthenticationService } from 'app/services/authentication.service';

// const routes = [
//   {route: '/family', title: 'Family'},
//   {route: '/history', title: 'History'},
//   {route: '/writings', title: 'Writings'},
//   {route: '/family-tree', title: 'Family Tree'}
// ]

@Component({
  selector: 'app-main-app',
  templateUrl: './main-app.component.html',
  styleUrls: ['./main-app.component.css']
})
export class MainAppComponent implements OnInit {
  private menuShown: boolean = false;
  // private routes = routes;

  constructor(
    private user: User,
    private authentication: AuthenticationService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  logout(): void {
    this.authentication.logout();
    this.router.navigate(['/login']);
  }

}
