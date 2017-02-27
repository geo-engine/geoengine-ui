import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GbifOperatorComponent } from './gbif-operator.component';

describe('GbifOperatorComponent', () => {
  let component: GbifOperatorComponent;
  let fixture: ComponentFixture<GbifOperatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GbifOperatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GbifOperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
