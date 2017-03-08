/**
 * Created by Julian on 24.02.2017.
 */
import {Component, ElementRef} from '@angular/core';
import {CSV} from '../csv-config/csv-config.component';
import {Input} from '@angular/core/src/metadata/directives';

@Component({
  selector: 'wave-csv-upload',
  templateUrl: 'file-upload-template.component.html',
  styleUrls: ['file-upload-style.component.css']
})
export class CsvUploadComponent {

  data: {
      file: File,
      content: string,
      progress: number,
      configured: boolean,
      isNull: boolean
  } = {
      file: null,
      content: '',
      progress: 0,
      configured: false,
      isNull: true
  };

  result: CSV;
  editing: boolean;

  changeListener($event): void {
    if ($event.target.files.length > 0) {
      this.data = {
          file: $event.target.files[0],
          content: '',
          progress: 0,
          configured: false,
          isNull: false
      };
      $event.target.value = '';
    } else {
        this.data = {
            file: null,
            content: '',
            progress: 0,
            configured: false,
            isNull: true
        };
    }
  }

  upload() {
    let reader: FileReader = new FileReader();

    reader.onload = ((e) => {
      this.data.content = reader.result;
      this.data.progress = 100;
      this.configure();
    });
    reader.onerror = ((e) => {
      console.log('Error encountered file upload');
    });
    reader.onprogress = ((e) => {
      this.data.progress = e.loaded / e.total * 100;
      console.log('progressed: ' + e.loaded / e.total * 100 + '% on file');
    });
    reader.onloadstart = ((e) => {
      console.log('Reader started reading ' + this.data.file.name);
    });

    reader.readAsText(this.data.file);
  }

  configure() {
    if (this.data.isNull) {
        return;
    }
    this.editing = true;
  }

  delete() {
    this.editing = false;
    this.data = {
        file: null,
        content: '',
        progress: 0,
        configured: false,
        isNull: true
    };
    this.result = null;
  }

  submit(e:CSV) {
      console.log(e);
      this.result = e;
      this.data.configured = true;
      this.editing = false;
  }

  /**This method generates an number array containing all integers i with n <= i < m
   *
   * @param n lowest integer. !Warning: This integer is still contained in array.
   * @param m highest integer. !Warning: This integer is not contained in array.
   * @returns {number[]} Array {n,..,m-1}
   */
  range(n: number, m: number): number[] {
    let res: number[] = [];
    for (let i: number = n; i < m; i++) {
      res.push(i);
    }
    return res;
  }
}
