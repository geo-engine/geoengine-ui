/**
 * Created by Julian on 24.02.2017.
 */
import {Component, Input} from '@angular/core';
import {CSV} from '../csv-config/csv-config.component';
import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

enum FormStatus {
    Selection,
    Error,
    Loading,
    Finished
}

@Component({
    selector: 'wave-csv-upload',
    templateUrl: 'file-upload-template.component.html',
    styleUrls: ['file-upload-style.component.css']
})
export class CsvUploadComponent {

    status$: BehaviorSubject<FormStatus> = new BehaviorSubject<FormStatus>(FormStatus.Selection);
    isSelecting$: Observable<boolean>;
    isLoading$: Observable<boolean>;
    isFinished$: Observable<boolean>;
    isError$: Observable<boolean>;

    @Input() file_size_limit: number;

    data: {
        file: File,
        content: string,
        progress: number,
        isNull: boolean
    } = {
        file: null,
        content: '',
        progress: 0,
        isNull: true
    };

    result: CSV;

    constructor() {
        this.isSelecting$ = this.status$.map((status) => status === FormStatus.Selection);
        this.isLoading$ = this.status$.map((status) => status === FormStatus.Loading);
        this.isFinished$ = this.status$.map((status) => status === FormStatus.Finished);
        this.isError$ = this.status$.map((status) => status === FormStatus.Error);
    }

    changeListener($event): void {
        if ($event.target.files.length > 0 && $event.target.files[0].size <= this.file_size_limit) {
            this.data = {
                file: $event.target.files[0],
                content: '',
                progress: 0,
                isNull: false
            };
            $event.target.value = '';
            this.upload();
            this.status$.next(FormStatus.Loading);
        } else {
            this.data = {
                file: null,
                content: '',
                progress: 0,
                isNull: true
            };
            if ($event.target.files[0].size > this.file_size_limit) {
                $event.target.value = '';
                this.status$.next(FormStatus.Error);
            }
        }
    }

    upload() {
        let reader: FileReader = new FileReader();

        reader.onload = ((e) => {
            this.data.content = reader.result;
            this.data.progress = 100;
            this.status$.next(FormStatus.Finished);
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

    unerror() {
        this.status$.next(FormStatus.Selection);
    }

    submit(e: CSV) {
        console.log(e);
        this.result = e;
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
