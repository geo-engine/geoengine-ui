/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { RasterValueExtractionOperatorComponent } from './raster-value-extraction.component';

describe('RasterValueExtractionOperatorComponent', () => {
  let component: RasterValueExtractionOperatorComponent;
  let fixture: ComponentFixture<RasterValueExtractionOperatorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RasterValueExtractionOperatorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RasterValueExtractionOperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
