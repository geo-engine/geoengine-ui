import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WaveCoreComponent } from './wave-core.component';

describe('WaveCoreComponent', () => {
  let component: WaveCoreComponent;
  let fixture: ComponentFixture<WaveCoreComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WaveCoreComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WaveCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
