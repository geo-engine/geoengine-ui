import { TestBed, inject } from '@angular/core/testing';

import { SidenavRef } from './sidenav-ref.service';

describe('SidenavRef', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SidenavRef]
    });
  });

  it('should ...', inject([SidenavRef], (service: SidenavRef) => {
    expect(service).toBeTruthy();
  }));
});
