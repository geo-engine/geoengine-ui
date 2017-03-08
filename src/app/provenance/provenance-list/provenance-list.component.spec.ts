import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProvenanceListComponent } from './provenance-list.component';

describe('ProvenanceListComponent', () => {
  let component: ProvenanceListComponent;
  let fixture: ComponentFixture<ProvenanceListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProvenanceListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProvenanceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
