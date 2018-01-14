import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';

@Injectable()
export class FamilyTreeService {
  private family;
  constructor(private http: Http) { }

  getFamily (id) {
    let headers = new Headers({'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('user')}`})
    return this.http.get(`/api/family-tree/${id}`, {headers})
    .toPromise()
    .then(response => this.family = response.json());
    // .catch(this.handleError);
  }

}
