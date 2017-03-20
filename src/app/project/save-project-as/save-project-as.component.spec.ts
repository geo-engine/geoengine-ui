import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SaveProjectAsComponent } from './save-project-as.component';

describe('SaveProjectAsComponent', () => {
  let component: SaveProjectAsComponent;
  let fixture: ComponentFixture<SaveProjectAsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SaveProjectAsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SaveProjectAsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
