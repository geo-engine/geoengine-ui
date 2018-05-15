import {Component, Input, Output, EventEmitter, OnDestroy, OnInit} from '@angular/core';
import {Observable, BehaviorSubject, Subscription} from 'rxjs/Rx';

enum FormStatus {
    Selection,
    Error,
    Loading,
    Finished
}

export interface UploadData {
    file: File;
    content: string;
    progress: number;
    isNull: boolean;
}

@Component({
    selector: 'wave-csv-upload',
    templateUrl: './csv-upload-template.component.html',
    styleUrls: ['./csv-upload-style.component.css']
})
export class CsvUploadComponent implements OnInit, OnDestroy {

    status$: BehaviorSubject<FormStatus> = new BehaviorSubject<FormStatus>(FormStatus.Selection);
    isSelecting$: Observable<boolean>;
    isLoading$: Observable<boolean>;
    isFinished$: Observable<boolean>;
    isError$: Observable<boolean>;

    @Input() file_size_limit: number;
    @Output() onData = new EventEmitter<UploadData>();

    data: UploadData = {
        file: null,
        content: '',
        progress: 0,
        isNull: true,
    };

    private subscriptions: Array<Subscription> = [];

    constructor() {
        this.isSelecting$ = this.status$.map((status) => status === FormStatus.Selection);
        this.isLoading$ = this.status$.map((status) => status === FormStatus.Loading);
        this.isFinished$ = this.status$.filter((status) => status === FormStatus.Finished).mapTo(true);
        this.isError$ = this.status$.map((status) => status === FormStatus.Error);
    }

    ngOnInit() {
        this.subscriptions.push(
            this.isFinished$.subscribe(() => this.onData.emit(this.data))
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    changeListener($event): void {
        if ($event.target.files.length > 0 && $event.target.files[0].size <= this.file_size_limit) {
            this.data = {
                file: $event.target.files[0],
                content: '',
                progress: 0,
                isNull: false,
            };
            $event.target.value = '';
            this.upload();
            this.status$.next(FormStatus.Loading);
        } else {
            this.data = {
                file: null,
                content: '',
                progress: 0,
                isNull: true,
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

        reader.readAsText(this.data.file);
    }

    unerror() {
        this.status$.next(FormStatus.Selection);
    }

    /**This method generates a number array containing all integers i with n <= i < m
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
