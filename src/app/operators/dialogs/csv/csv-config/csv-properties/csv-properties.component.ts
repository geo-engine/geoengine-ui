/**
 * Created by Julian on 04/05/2017.
 */
import {Component, ChangeDetectionStrategy, OnInit, AfterViewInit, Input, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl} from '@angular/forms';
import {Observable, BehaviorSubject, Subscription} from 'rxjs';
import {IntervalFormat} from '../../interval.enum';
import {CsvTableComponent} from '../csv-table/csv-table.component';

export enum FormStatus { DataProperties, SpatialProperties, TemporalProperties, TypingProperties, Loading }

@Component({
    selector: 'wave-csv-properties',
    templateUrl: './csv-properties-template.component.html',
    styleUrls: ['./csv-properties.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvPropertiesComponent implements OnInit, AfterViewInit, OnDestroy {

    delimiters: {def: string, value: string}[] = [
        {def: 'TAB', value: '\t'},
        {def: 'COMMA', value: ','},
        {def: 'SEMICOLON', value: ';'}
    ];

    // http://man7.org/linux/man-pages/man3/strptime.3.html
    timeFormats: Array<{display: string, value: string}> = [
        {display: 'yyyy-MM-ddTHH:mm:ssZ', value: '%Y-%m-%dT%H:%M:%SZ'},
        {display: 'yyyy-MM-ddTHH:mmZ', value: '%Y-%m-%dT%H:%MZ'},
        {display: 'dd-MM-yyyy HH:mm:ss', value: '%d-%m-%Y %H:%M:%S'},
        {display: 'dd.MM.yyyy HH:mm:ss', value: '%d.%m.%Y %H:%M:%S'},
        {display: 'yyyy-MM-dd HH:mm:ssZ', value: '%Y-%m-%d %H:%M:%SZ'},
        {display: 'yyyy-MM-dd HH:mmZ', value: '%Y-%m-%d %H:%MZ'},
        {display: 'dd.MM.yyyy', value: '%d.%m.%Y'},
        {display: 'yyyy-MM-dd', value: '%Y-%m-%d'},
    ];
    durationFormats: Array<{display: string, value: string}> = [
        // {display: 'days', value: 'd'},
        // {display: 'hours', value: 'h'},
        {display: 'seconds', value: 'seconds'},
    ];
    intervalTypes: Array<{display: string, value: IntervalFormat}> = [
        {display: '[Start,+inf)', value: IntervalFormat.StartInf},
        {display: '[Start, End]', value: IntervalFormat.StartEnd},
        {display: '[Start, Start+Duration]', value: IntervalFormat.StartDur},
        {display: '[Start, Start+Constant]', value: IntervalFormat.StartConst},
    ];
    decimalSeparators: string[] = [',', '.'];
    textQualifiers: string[] = ['"', '\''];
    coordinateFormats: string[] = ['Degrees Minutes Seconds', 'Degrees Decimal Minutes', 'Decimal Degrees'];

    dataProperties: FormGroup = new FormGroup({
        delimiter: new FormControl(this.delimiters[1].value, Validators.required),
        decimalSeparator: new FormControl(this.decimalSeparators[1], Validators.required),
        isTextQualifier: new FormControl(false),
        textQualifier: new FormControl({value: this.textQualifiers[0], disabled: true}, Validators.required),
        isHeaderRow: new FormControl(true),
        headerRow: new FormControl({value: 0, disabled: true}, Validators.required),
    });
    spatialProperties: FormGroup = new FormGroup({
        xColumn: new FormControl(0, Validators.required),//Validator not equal to yCol
        yColumn: new FormControl(1, Validators.required),
    });
    temporalProperties: FormGroup = new FormGroup({
        intervalType: new FormControl(IntervalFormat.StartEnd),
        isTime: new FormControl(false),
        startColumn: new FormControl(2),// Anpassung ungleich x
        endColumn: new FormControl(3),// Anpassung ungleich y
    });
    typingProperties:FormGroup = new FormGroup({});

    dialogTitle: string;
    subtitleDescription: string;

    formStatus$: BehaviorSubject<FormStatus> = new BehaviorSubject<FormStatus>(FormStatus.Loading);
    isDataProperties$: Observable<boolean>;
    isSpatialProperties$: Observable<boolean>;
    isTemporalProperties$: Observable<boolean>;
    isTypingProperties$: Observable<boolean>;

    @Input('table') csvTable: CsvTableComponent;

    actualPage$: BehaviorSubject<FormGroup> = new BehaviorSubject<FormGroup>(null);

    private subscriptions: Array<Subscription> = [];

    constructor() {
        this.isDataProperties$ = this.formStatus$.map(status => status === FormStatus.DataProperties);
        this.isSpatialProperties$ = this.formStatus$.map(status => status === FormStatus.SpatialProperties);
        this.isTemporalProperties$ = this.formStatus$.map(status => status === FormStatus.TemporalProperties);
        this.isTypingProperties$ = this.formStatus$.map(status => status === FormStatus.TypingProperties);
    }

    ngOnInit() {
        this.subscriptions.push(
            this.formStatus$.subscribe(status => {
            switch (status) {
                case FormStatus.DataProperties:
                    this.dialogTitle = 'CSV Settings';
                    this.subtitleDescription = 'Please specify the properties of your CSV file, e.g. the delimiter.';
                    break;
                case FormStatus.SpatialProperties:
                    this.dialogTitle = 'Spatial Properties';
                    this.subtitleDescription = 'In this step you can specify the spatial columns of your CSV file.';
                    break;
                case FormStatus.TemporalProperties:
                    this.dialogTitle = 'Temporal Properties';
                    this.subtitleDescription = 'This step allows you to specify temporal columns of your CSV file.';
                    break;
                case FormStatus.TypingProperties:
                    this.dialogTitle = 'Typing Properties';
                    this.subtitleDescription = 'You can specify the data types of the remaining columns here.';
                    break;
                case FormStatus.Loading:
                /* falls through */
                default:
                    break;
            }
        }),
        this.dataProperties.valueChanges.subscribe(data => {
            this.csvTable.parse();
            this.csvTable.resize();
        }),
        this.dataProperties['controls']['isHeaderRow'].valueChanges.subscribe(data => {
            if(data === true) {
                this.csvTable.customHeader = [];
                for(let i: number = 0; i < this.csvTable.header.length; i++) {
                    this.csvTable.customHeader[i] = this.csvTable.header[i];
                }
            } else {
                if(this.csvTable.customHeader.length === this.csvTable.elements[0].length) {
                    for(let i: number = 0; i < this.csvTable.customHeader.length; i++) {
                        this.csvTable.header[i] = this.csvTable.customHeader[i];
                    }
                } else {
                    this.csvTable.customHeader = [];
                    this.csvTable.header = new Array(this.csvTable.elements[0].length);
                }
            }
        })
        );
        this.formStatus$.next(FormStatus.DataProperties);
        this.actualPage$.next(this.dataProperties);
    }

    ngAfterViewInit() {
        setTimeout(() => {
            this.dataProperties['controls']['delimiter'].setValue(this.delimiters[1].value);
        });
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    nextPage() {
        switch (this.formStatus$.getValue()) {
            case FormStatus.DataProperties:
                this.actualPage$.next(this.spatialProperties);
                this.formStatus$.next(FormStatus.SpatialProperties);
                break;
            case FormStatus.SpatialProperties:
                this.actualPage$.next(this.temporalProperties);
                this.formStatus$.next(FormStatus.TemporalProperties);
                break;
            default:
                this.actualPage$.next(this.typingProperties);
                this.formStatus$.next(FormStatus.TypingProperties);
        }
    }

    previousPage() {
        let value: string;
        switch (this.formStatus$.getValue()) {
            case FormStatus.TemporalProperties:
                this.actualPage$.next(this.spatialProperties);
                this.formStatus$.next(FormStatus.SpatialProperties);
                value = 'xColumn';
                break;
            case FormStatus.TypingProperties:
                this.actualPage$.next(this.temporalProperties);
                this.formStatus$.next(FormStatus.TemporalProperties);
                value = 'intervalType';
                break;
            default:
                this.actualPage$.next(this.dataProperties);
                this.formStatus$.next(FormStatus.DataProperties);
                value = 'delimiter'
        }
        setTimeout(() => {
            this.actualPage$.getValue().controls[value].updateValueAndValidity({
                onlySelf: false,
                emitEvent: true
            });
        }, 0);
    }
}
