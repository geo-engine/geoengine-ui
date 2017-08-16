/**
 * Created by Julian on 04/05/2017.
 */
import {
    Component, ChangeDetectionStrategy, OnInit, AfterViewInit, Input, OnDestroy,
    ChangeDetectorRef, forwardRef
} from '@angular/core';
import {FormBuilder, FormGroup, Validators, FormControl, ValidatorFn, AbstractControl} from '@angular/forms';
import {Observable, BehaviorSubject, Subscription, ReplaySubject} from 'rxjs';
import {IntervalFormat} from '../../interval.enum';
import {CsvTableComponent} from '../csv-table/csv-table.component';
import {Projection, Projections} from '../../../../projection.model';
import Interval = d3.time.Interval;
import {UserService} from '../../../../../users/user.service';

export enum FormStatus { DataProperties, SpatialProperties, TemporalProperties, TypingProperties, Loading }

@Component({
    selector: 'wave-csv-properties',
    templateUrl: './csv-properties-template.component.html',
    styleUrls: ['./csv-properties.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CsvPropertiesComponent implements OnInit, AfterViewInit, OnDestroy {

    Projections = Projections;
    FormStatus = FormStatus;
    IntervalFormat = IntervalFormat;

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
        spatialReferenceSystem: new FormControl(Projections.WGS_84),
        coordinateFormat: new FormControl({value: this.coordinateFormats[2], disabled: true}, Validators.required),
    });
    temporalProperties: FormGroup = new FormGroup({
        intervalType: new FormControl(IntervalFormat.StartInf),
        isTime: new FormControl(false),
        startColumn: new FormControl(2),// Anpassung ungleich x
        startFormat: new FormControl(this.timeFormats[0].value),
        endColumn: new FormControl(3),// Anpassung ungleich y
        endFormat: new FormControl(this.timeFormats[0].value),
        constantDuration: new FormControl(0),
    });
    typingProperties: FormGroup = new FormGroup({});

    dialogTitle: string;
    subtitleDescription: string;

    formStatus$: BehaviorSubject<FormStatus> = new BehaviorSubject<FormStatus>(this.FormStatus.Loading);
    isDataProperties$: Observable<boolean>;
    isSpatialProperties$: Observable<boolean>;
    isTemporalProperties$: Observable<boolean>;
    isTypingProperties$: Observable<boolean>;

    xyColumn$: BehaviorSubject<{x: number, y: number}> = new BehaviorSubject<{x: number, y: number}>({x: 0, y: 0});
    xColumn$: Observable<number>;
    yColumn$: Observable<number>;

    layerName: string;

    nameIsReserved$: Observable<boolean>;
    storageName$ = new ReplaySubject<string>(1);
    private reservedNames$ = new BehaviorSubject<Array<string>>([]);

    @Input('table') csvTable: CsvTableComponent;
    @Input() data: {file: File, content: string, progress: number, configured: boolean, isNumberArray: boolean[]};

    actualPage$: BehaviorSubject<FormGroup> = new BehaviorSubject<FormGroup>(null);

    private subscriptions: Array<Subscription> = [];

    constructor(private userService: UserService, public _changeDetectorRef: ChangeDetectorRef) {
        setTimeout( () => this._changeDetectorRef.markForCheck(), 10);
        this.xColumn$ = this.xyColumn$.map(xy => xy.x);
        this.yColumn$ = this.xyColumn$.map(xy => xy.y);
        this.xyColumn$.next({x: this.spatialProperties.controls['xColumn'].value,
            y: this.spatialProperties.controls['yColumn'].value}
        );
        this.isDataProperties$ = this.formStatus$.map(status => status === this.FormStatus.DataProperties);
        this.isSpatialProperties$ = this.formStatus$.map(status => status === this.FormStatus.SpatialProperties);
        this.isTemporalProperties$ = this.formStatus$.map(status => status === this.FormStatus.TemporalProperties);
        this.isTypingProperties$ = this.formStatus$.map(status => status === this.FormStatus.TypingProperties);

        this.userService.getFeatureDBList()
            .map(entries => entries.map(entry => entry.name))
            .subscribe(names => this.reservedNames$.next(names));

        this.nameIsReserved$ = Observable.combineLatest(
            this.reservedNames$,
            this.storageName$,
            (reservedNames, storageName) => reservedNames.indexOf(storageName) >= 0
        );
    }

    ngOnInit() {
        this.layerName = this.data.file.name;
        this.subscriptions.push(
            this.formStatus$.subscribe(status => {
                switch (status) {
                    case this.FormStatus.DataProperties:
                        this.dialogTitle = 'CSV Settings';
                        this.subtitleDescription = 'Please specify the properties of your CSV file, e.g. the delimiter.';
                        break;
                    case this.FormStatus.SpatialProperties:
                        this.dialogTitle = 'Spatial Properties';
                        this.subtitleDescription = 'In this step you can specify the spatial columns of your CSV file.';
                        break;
                    case this.FormStatus.TemporalProperties:
                        this.dialogTitle = 'Temporal Properties';
                        this.subtitleDescription = 'This step allows you to specify temporal columns of your CSV file.';
                        break;
                    case this.FormStatus.TypingProperties:
                        this.dialogTitle = 'Typing Properties';
                        this.subtitleDescription = 'You can specify the data types of the remaining columns here.';
                        break;
                    case this.FormStatus.Loading:
                    /* falls through */
                    default:
                        break;
                }
                this.update(10);
                setTimeout(() => this.update(10), 10);
            }),
            this.dataProperties.valueChanges.subscribe(data => {
                this.csvTable.parse();
                setTimeout(() => this.csvTable.resize(), 50);
            }),
            this.dataProperties.controls['isHeaderRow'].valueChanges.subscribe(data => {
                if (data === true) {
                    this.csvTable.customHeader = [];
                    for (let i: number = 0; i < this.csvTable.header.length; i++) {
                        this.csvTable.customHeader[i] = this.csvTable.header[i];
                    }
                } else {
                    if (this.csvTable.customHeader.length === this.csvTable.elements[0].length) {
                        for (let i: number = 0; i < this.csvTable.customHeader.length; i++) {
                            this.csvTable.header[i] = this.csvTable.customHeader[i];
                        }
                    } else {
                        this.csvTable.customHeader = [];
                        this.csvTable.header = new Array(this.csvTable.elements[0].length);
                    }
                }
            }),
            this.spatialProperties.controls['xColumn'].valueChanges.subscribe(x => {
                if(x === this.spatialProperties.controls['yColumn'].value) {
                    if(x === this.csvTable.header.length - 1) {
                        this.spatialProperties.controls['yColumn'].setValue(this.spatialProperties.controls['yColumn'].value-1);
                    } else {
                        this.spatialProperties.controls['yColumn'].setValue(this.spatialProperties.controls['yColumn'].value+1);
                    }
                }
                if(this.temporalProperties.controls['isTime'].value) {
                    this.correctColumns();
                }
                this.xyColumn$.next({x: x, y: this.spatialProperties.controls['yColumn'].value});
            }),
            this.spatialProperties.controls['yColumn'].valueChanges.subscribe(y => {
                if(y === this.spatialProperties.controls['xColumn'].value) {
                    if(y === this.csvTable.header.length - 1) {
                        this.spatialProperties.controls['xColumn'].setValue(this.spatialProperties.controls['xColumn'].value-1);
                    } else {
                        this.spatialProperties.controls['xColumn'].setValue(this.spatialProperties.controls['xColumn'].value+1);
                    }
                }
                if(this.temporalProperties.controls['isTime'].value) {
                    this.correctColumns();
                }
                this.xyColumn$.next({x: this.spatialProperties.controls['xColumn'].value, y: y});
            }),
            this.temporalProperties.controls['startColumn'].valueChanges.subscribe(start => {
                if(start === this.temporalProperties.controls['endColumn'].value) {
                    if(start === this.csvTable.header.length - 1) {
                        this.temporalProperties.controls['endColumn'].setValue(this.temporalProperties.controls['endColumn'].value-1);
                    } else {
                        this.temporalProperties.controls['endColumn'].setValue(this.temporalProperties.controls['endColumn'].value+1);
                    }
                }
                this.xyColumn$.next({x: start, y: this.temporalProperties.controls['endColumn'].value});
            }),
            this.temporalProperties.controls['endColumn'].valueChanges.subscribe(end => {
                if(end === this.temporalProperties.controls['startColumn'].value) {
                    if(end === this.csvTable.header.length - 1) {
                        this.temporalProperties.controls['startColumn'].setValue(this.temporalProperties.controls['startColumn'].value-1);
                    } else {
                        this.temporalProperties.controls['startColumn'].setValue(this.temporalProperties.controls['startColumn'].value+1);
                    }
                }
                this.xyColumn$.next({x: this.temporalProperties.controls['startColumn'].value, y: end});
            }),
            this.temporalProperties.controls['isTime'].valueChanges.subscribe(value => {
                if(value === false) {
                    this.temporalProperties.controls['startColumn'].disable();
                    this.temporalProperties.controls['startFormat'].disable();
                    this.temporalProperties.controls['endColumn'].disable();
                    this.temporalProperties.controls['endFormat'].disable();
                    this.temporalProperties.controls['intervalType'].disable();
                } else {
                    this.temporalProperties.controls['startColumn'].enable();
                    this.temporalProperties.controls['startFormat'].enable();
                    if([IntervalFormat.StartDur, IntervalFormat.StartConst].indexOf(this.temporalProperties.controls['intervalType'].value) < 0) {
                        this.temporalProperties.controls['endColumn'].enable();
                        this.temporalProperties.controls['endFormat'].enable();
                    }
                    this.temporalProperties.controls['intervalType'].enable();
                }
                this.correctColumns();
                this.xyColumn$.next({x: this.temporalProperties.controls['startColumn'].value, y: this.temporalProperties.controls['endColumn'].value});
            }),
            this.temporalProperties.controls['intervalType'].valueChanges.subscribe(value => {
                if([IntervalFormat.StartInf].indexOf(value) >= 0 || !this.temporalProperties.controls['isTime'].value) {
                    this.temporalProperties.controls['endFormat'].disable();
                    this.temporalProperties.controls['endColumn'].disable();
                } else {
                    this.temporalProperties.controls['endFormat'].enable();
                    this.temporalProperties.controls['endColumn'].enable();
                    if([IntervalFormat.StartDur, IntervalFormat.StartConst].indexOf(value) >= 0) {
                        this.temporalProperties.controls['endFormat'].setValue(this.durationFormats[0].value);
                    }else {
                        this.temporalProperties.controls['endFormat'].setValue(this.timeFormats[0].value);
                    }
                }
                this.update(10);
            }),
        );
        this.formStatus$.next(this.FormStatus.DataProperties);
        this.actualPage$.next(this.dataProperties);
    }

    ngAfterViewInit() {
        this.dataProperties.updateValueAndValidity({
            onlySelf: false,
            emitEvent: true
        });
        this.update(10);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    /**
     * @param type 0 left-click, 1 right-click
     * @param value the column index
     */
    setProperty(type: number, value: number, event: Event) {
        if(this.formStatus$.getValue() == this.FormStatus.SpatialProperties) {
            if(type == 0) {
                this.spatialProperties.controls['xColumn'].setValue(value);
            }else if(type == 1) {
                this.spatialProperties.controls['yColumn'].setValue(value);
            }
        }else if(this.formStatus$.getValue() == this.FormStatus.TemporalProperties) {
            if(type == 0 && this.temporalProperties.controls['startColumn'].enabled) {
                this.temporalProperties.controls['startColumn'].setValue(value);
            }else if(type == 1 && this.temporalProperties.controls['endColumn'].enabled) {
                this.temporalProperties.controls['endColumn'].setValue(value);
            }
        }
        this.correctColumns();
    }

    nextPage() {
        switch (this.formStatus$.getValue()) {
            case this.FormStatus.DataProperties:
                this.actualPage$.next(this.spatialProperties);
                this.formStatus$.next(this.FormStatus.SpatialProperties);
                break;
            case this.FormStatus.SpatialProperties:
                this.actualPage$.next(this.temporalProperties);
                this.formStatus$.next(this.FormStatus.TemporalProperties);
                break;
            default:
                this.actualPage$.next(this.typingProperties);
                this.formStatus$.next(this.FormStatus.TypingProperties);
        }
        if(this.actualPage$.getValue() === this.temporalProperties) {
            this.xyColumn$.next({x: this.temporalProperties.controls['startColumn'].value,
                y: this.temporalProperties.controls['endColumn'].value});
        }
        if(this.actualPage$.getValue() === this.spatialProperties) {
            this.xyColumn$.next({x: this.spatialProperties.controls['xColumn'].value,
                y: this.spatialProperties.controls['yColumn'].value});
        }
        if(this.actualPage$.getValue() === this.typingProperties) {
            this.csvTable.resize();
        }
    }

    previousPage() {
        switch (this.formStatus$.getValue()) {
            case this.FormStatus.TemporalProperties:
                this.actualPage$.next(this.spatialProperties);
                this.formStatus$.next(this.FormStatus.SpatialProperties);
                break;
            case this.FormStatus.TypingProperties:
                this.actualPage$.next(this.temporalProperties);
                this.formStatus$.next(this.FormStatus.TemporalProperties);
                break;
            default:
                this.actualPage$.next(this.dataProperties);
                this.formStatus$.next(this.FormStatus.DataProperties);
        }
        if(this.actualPage$.getValue() === this.temporalProperties) {
            this.xyColumn$.next({x: this.temporalProperties.controls['startColumn'].value,
                y: this.temporalProperties.controls['endColumn'].value});
        }
        if(this.actualPage$.getValue() === this.spatialProperties) {
            this.xyColumn$.next({x: this.spatialProperties.controls['xColumn'].value,
                y: this.spatialProperties.controls['yColumn'].value});
        }
        if(this.formStatus$.getValue() === this.FormStatus.TemporalProperties) {
            this.csvTable.resize();
        }
    }

    update(timeOut:number) {
        setTimeout(() => {
            this._changeDetectorRef.reattach();
            this._changeDetectorRef.detectChanges();
        }, timeOut);
    }

    correctColumns() {
        let direction = 1;
        let arr = [this.spatialProperties.controls['xColumn'].value,
            this.spatialProperties.controls['yColumn'].value];
        if(!this.temporalProperties.controls['endColumn'].disabled) {
            arr.push(this.temporalProperties.controls['endColumn'].value);
        }
        while(arr.indexOf(this.temporalProperties.controls['startColumn'].value) >= 0) {
            if(this.temporalProperties.controls['startColumn'].value === 0) {
                direction = 1;
            } else if(this.temporalProperties.controls['startColumn'].value === this.csvTable.header.length - 1) {
                direction = -1;
            }
            this.temporalProperties.controls['startColumn'].setValue(this.temporalProperties.controls['startColumn'].value + direction,
                {onlySelf: true, emitEvent: false});
        }
        if(!this.temporalProperties.controls['endColumn'].disabled) {
            direction = 1;
            arr = [this.spatialProperties.controls['xColumn'].value,
                this.spatialProperties.controls['yColumn'].value,
                this.temporalProperties.controls['startColumn'].value];
            while(arr.indexOf(this.temporalProperties.controls['endColumn'].value) >= 0) {
                if(this.temporalProperties.controls['startColumn'].value === 0) {
                    direction = 1;
                } else if(this.temporalProperties.controls['startColumn'].value === this.csvTable.header.length - 1) {
                    direction = -1;
                }
                this.temporalProperties.controls['endColumn'].setValue(this.temporalProperties.controls['endColumn'].value + direction,
                    {onlySelf: true, emitEvent: false});
            }
        }
    }
}
