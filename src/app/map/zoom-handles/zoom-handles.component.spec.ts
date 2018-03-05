import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ZoomHandlesComponent } from './zoom-handles.component';

describe('ZoomHandlesComponent', () => {
  let component: ZoomHandlesComponent;
  let fixture: ComponentFixture<ZoomHandlesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ZoomHandlesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ZoomHandlesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
