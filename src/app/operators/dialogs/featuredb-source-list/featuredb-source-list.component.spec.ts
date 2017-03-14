import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FeaturedbSourceListComponent } from './featuredb-source-list.component';

describe('FeaturedbSourceListComponent', () => {
  let component: FeaturedbSourceListComponent;
  let fixture: ComponentFixture<FeaturedbSourceListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FeaturedbSourceListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FeaturedbSourceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
