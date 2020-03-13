import { TestBed } from '@angular/core/testing';

import { WaveCoreService } from './wave-core.service';

describe('WaveCoreService', () => {
  let service: WaveCoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WaveCoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
