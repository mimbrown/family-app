import { Headers, Http } from '@angular/http';

import 'rxjs/add/operator/toPromise';

export abstract class StoreBaseService<T> {
  private baseUrl = 'api';
  protected url = '';
  private loading: Promise<T[]>;
  private data: T[];
  constructor(private http: Http) { }
  public getData(): Promise<T[]> {
    if (this.data) {
      return Promise.resolve(this.data);
    } else if (this.loading) {
      return this.loading;
    }
    let headers = new Headers({'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('user')}`})
    return this.loading = this.http.get(`${this.baseUrl}/${this.url}`, {headers: headers})
    .toPromise()
    .then(response => this.data = response.json() as T[])
    .catch(this.handleError);
  }
  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
}
}
