import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RScriptLoadComponent } from './r-script-load.component';

describe('RScriptLoadComponent', () => {
  let component: RScriptLoadComponent;
  let fixture: ComponentFixture<RScriptLoadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RScriptLoadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RScriptLoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
