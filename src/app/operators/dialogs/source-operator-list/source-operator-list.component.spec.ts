import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SourceOperatorListComponent } from './source-operator-list.component';

describe('SourceOperatorListComponent', () => {
  let component: SourceOperatorListComponent;
  let fixture: ComponentFixture<SourceOperatorListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SourceOperatorListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SourceOperatorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
