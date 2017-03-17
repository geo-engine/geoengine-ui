import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ROperatorComponent } from './r-operator.component';

describe('ROperatorComponent', () => {
  let component: ROperatorComponent;
  let fixture: ComponentFixture<ROperatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ROperatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ROperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
