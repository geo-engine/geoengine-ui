import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangeProjectionComponent } from './change-projection.component';

describe('ChangeProjectionComponent', () => {
  let component: ChangeProjectionComponent;
  let fixture: ComponentFixture<ChangeProjectionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChangeProjectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangeProjectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
