import { TestBed, inject } from '@angular/core/testing';

import { MemberLoginService } from './member-login.service';

describe('MemberLoginService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MemberLoginService]
    });
  });

  it('should be created', inject([MemberLoginService], (service: MemberLoginService) => {
    expect(service).toBeTruthy();
  }));
});
