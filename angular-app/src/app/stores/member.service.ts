import { Injectable } from '@angular/core';
import { Http } from '@angular/http';

import { StoreBaseService } from './store-base.service';
import { Member } from 'app/models/member';

@Injectable()
export class MemberService extends StoreBaseService<Member> {
  protected url = 'members';
  constructor(http: Http) {
    super(http);
  }

}
