import { TestBed, inject } from '@angular/core/testing';

import { FamilyTreeService } from './family-tree.service';

describe('FamilyTreeService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FamilyTreeService]
    });
  });

  it('should be created', inject([FamilyTreeService], (service: FamilyTreeService) => {
    expect(service).toBeTruthy();
  }));
});
