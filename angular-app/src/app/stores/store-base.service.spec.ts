import { TestBed, inject } from '@angular/core/testing';

import { StoreBaseService } from './store-base.service';

describe('StoreBaseService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StoreBaseService]
    });
  });

  it('should be created', inject([StoreBaseService], (service: StoreBaseService) => {
    expect(service).toBeTruthy();
  }));
});
