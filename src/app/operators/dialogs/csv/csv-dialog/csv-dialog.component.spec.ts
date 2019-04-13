import { async, ComponentFixture, TestBed, inject } from '@angular/core/testing';

import { CsvDialogComponent } from './csv-dialog.component';
import {CsvPropertiesService} from './csv.properties.service';
import {CsvPropertiesComponent} from '../csv-config/csv-properties/csv-properties.component';
import {CsvTableComponent} from '../csv-config/csv-table/csv-table.component';
import {CsvUploadComponent} from '../csv-upload/csv-upload.component';
import {MaterialModule} from '../../../../material.module';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {MatDialogModule, MatDialogRef} from "@angular/material";
import {DialogSectionHeadingComponent} from "../../../../dialogs/dialog-section-heading/dialog-section-heading.component";
import {DialogHeaderComponent} from "../../../../dialogs/dialog-header/dialog-header.component";
import {UserService} from "../../../../users/user.service";
import {RandomColorService} from "../../../../util/services/random-color.service";
import {ProjectService} from "../../../../project/project.service";
import {Operator} from "../../../operator.model";
import {Observable} from "rxjs/index";
import {of} from 'rxjs';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {ChangeDetectionStrategy} from "@angular/core";

class MockUserService {
    getFeatureDBList(): Observable<Array<{ name: string, operator: Operator }>> {
        return of([
            {name: 'name is taken', operator: null}
        ]);
    }
}
class MockProjectService {

}

describe('CsvDialogComponent', () => {
  let component: CsvDialogComponent;
  // let propertiesService: CsvPropertiesService;
  let fixture: ComponentFixture<CsvDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
          CsvDialogComponent,
          CsvPropertiesComponent,
          CsvTableComponent,
          CsvUploadComponent,
          DialogSectionHeadingComponent,
          DialogHeaderComponent
      ],
      imports: [
          MaterialModule,
          FormsModule,
          MatDialogModule,
          ReactiveFormsModule,
          BrowserAnimationsModule
      ],
      providers: [
          CsvPropertiesService,
          RandomColorService,
          {provide: ProjectService, useClass: MockProjectService},
          {provide: UserService, useClass: MockUserService},
          {provide: MatDialogRef, useValue: {}}
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CsvDialogComponent);
    component = fixture.componentInstance;
    // propertiesService = TestBed.get(CsvPropertiesService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // it('should parse correctly', inject([CsvPropertiesService], (propertiesService: CsvPropertiesService) => {
  //   const modifiedDate = new Date();
  //   component.data = {
  //       file: new File(['"a,b",c,d\n"1,2",3,4'], 'test-file.csv', {lastModified : modifiedDate.getDate(), type: 'csv'}),
  //       content: '"a,b",c,d\n"1,2",3,4',
  //       progress: 100,
  //       isNull: false
  //   };
  //   component.uploading$.next(false);
  //   propertiesService.changeDataProperties({
  //         delimiter: ',',
  //         decimalSeparator: '.',
  //         isTextQualifier: false,
  //         textQualifier: '"',
  //         isHeaderRow: true,
  //         headerRow: 0,
  //   });
  //   fixture.detectChanges();
  //   component.csvTable._changeDetectorRef.detectChanges();
  //   const table_rows = document.getElementsByTagName('tr');
  //   expect(table_rows[table_rows.length - 1].getElementsByTagName('td').length).toBe(5);
  //   // propertiesService.changeDataProperties({
  //   //     delimiter: ',',
  //   //     decimalSeparator: '.',
  //   //     isTextQualifier: false,
  //   //     textQualifier: '"',
  //   //     isHeaderRow: true,
  //   //     headerRow: 0,
  //   // });
  //   // fixture.detectChanges();
  //   // const table_rows_notext = document.getElementsByTagName('tr');
  //   // expect(table_rows_notext[table_rows_notext.length - 1].getElementsByTagName('td').length).toBe(5);
  // }));
});
