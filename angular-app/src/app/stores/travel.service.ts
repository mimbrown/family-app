import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { StoreBaseService } from './store-base.service';
import { Travel } from '../models/travel';

@Injectable()
export class TravelService extends StoreBaseService<Travel> {
  protected url = 'travels';
  constructor(http: Http) {
    super(http);
  }
}
