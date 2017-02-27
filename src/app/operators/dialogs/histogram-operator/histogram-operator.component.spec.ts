import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HistogramOperatorComponent } from './histogram-operator.component';

describe('HistogramOperatorComponent', () => {
  let component: HistogramOperatorComponent;
  let fixture: ComponentFixture<HistogramOperatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HistogramOperatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HistogramOperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
