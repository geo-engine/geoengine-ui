import { TestBed } from '@angular/core/testing';

import { LayerCollectionBreadcrumbsService } from './layer-collection-breadcrumbs.service';

describe('LayerCollectionBreadcrumbsService', () => {
  let service: LayerCollectionBreadcrumbsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LayerCollectionBreadcrumbsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
