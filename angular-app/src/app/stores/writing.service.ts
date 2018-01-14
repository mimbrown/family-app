import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { StoreBaseService } from './store-base.service';
import { Writing } from '../models/writing';

@Injectable()
export class WritingService extends StoreBaseService<Writing> {
  protected url = 'writings';
  constructor(http: Http) {
    super(http);
  }
}
