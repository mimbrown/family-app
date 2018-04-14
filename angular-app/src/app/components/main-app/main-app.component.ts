import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { User } from 'app/user.service';
import { AuthenticationService } from 'app/services/authentication.service';

const routes = [
  {route: '/family', title: 'Family', icon: 'users'},
  {route: '/history', title: 'History', icon: 'history'},
  {route: '/writings', title: 'Writings', icon: 'edit'},
  {route: '/family-tree', title: 'Family Tree', icon: 'tree'}
]

@Component({
  selector: 'app-main-app',
  templateUrl: './main-app.component.html',
  styleUrls: ['./main-app.component.scss']
})
export class MainAppComponent implements OnInit {
  menuShown: boolean = false;
  routes = routes;

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
