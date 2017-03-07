import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CsvDialogComponent } from './csv-dialog.component';

describe('CsvDialogComponent', () => {
  let component: CsvDialogComponent;
  let fixture: ComponentFixture<CsvDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CsvDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CsvDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
