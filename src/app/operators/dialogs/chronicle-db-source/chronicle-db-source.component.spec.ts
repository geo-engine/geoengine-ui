import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChronicleDbSourceComponent } from './chronicle-db-source.component';

describe('ChronicleDbSourceComponent', () => {
  let component: ChronicleDbSourceComponent;
  let fixture: ComponentFixture<ChronicleDbSourceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChronicleDbSourceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChronicleDbSourceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
