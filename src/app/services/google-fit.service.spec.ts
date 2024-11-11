import { TestBed } from '@angular/core/testing';

import { GoogleFitService } from './google-fit.service';

describe('GoogleFitService', () => {
  let service: GoogleFitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GoogleFitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
