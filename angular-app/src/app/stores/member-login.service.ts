import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { StoreBaseService } from './store-base.service';
import { MemberLogin } from '../models/member-login';

@Injectable()
export class MemberLoginService extends StoreBaseService<MemberLogin> {
  protected url = 'members-lite';
  constructor(http: Http) {
    super(http);
   }

}
