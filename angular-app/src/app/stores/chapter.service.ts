import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { StoreBaseService } from './store-base.service';
import { Chapter } from 'app/models/chapter';

@Injectable()
export class ChapterService extends StoreBaseService<Chapter> {
  protected url = 'chapters';
  constructor(http: Http) {
    super(http);
  }
}
