import {Observable, BehaviorSubject, Subscription, ReplaySubject} from 'rxjs';
import {map} from 'rxjs/operators';

import {
    Component, ChangeDetectionStrategy, OnInit, AfterViewInit, Input, OnDestroy, ChangeDetectorRef, ViewChild,
    ElementRef
} from '@angular/core';
import {FormGroup, Validators, FormControl, ValidatorFn, AbstractControl} from '@angular/forms';
import {IntervalFormat} from '../../interval.enum';
import {Projection, Projections} from '../../../../projection.model';
import {UserService} from '../../../../../users/user.service';
import {WaveValidators} from '../../../../../util/form.validators';
import {MatStepper} from '@angular/material';
import {CsvPropertiesService} from '../../csv-dialog/csv.properties.service';
import {ResultType, ResultTypes} from '../../../../result-type.model';

export interface DataPropertiesDict {
    delimiter: string,
    decimalSeparator: string,
    isTextQualifier: boolean,
    textQualifier: string,
    isHeaderRow: boolean,
    headerRow: number,
}

export interface SpatialPropertiesDict {
    xColumn: number,
    yColumn: number,
    spatialReferenceSystem: Projection,
    coordinateFormat: string,
    isWkt: boolean,
    wktResultType: ResultType,
}

export interface TemporalPropertiesDict {
    intervalType: IntervalFormat,
    isTime: boolean,
    startColumn: number,
    startFormat: string,
    endColumn: number,
    endFormat: string,
    constantDuration: number,
}

export enum FormStatus { DataProperties, SpatialProperties, TemporalProperties, TypingProperties, LayerProperties, Loading }

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

    isSpatialVisited = false;

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
    vectorTypes = ResultTypes.VECTOR_TYPES;

    dataProperties: FormGroup = new FormGroup({
        delimiter: new FormControl(this.delimiters[1].value, Validators.required),
        decimalSeparator: new FormControl(this.decimalSeparators[1], Validators.required),
        isTextQualifier: new FormControl(true),
        textQualifier: new FormControl({value: this.textQualifiers[0], disabled: true}, Validators.required),
        isHeaderRow: new FormControl(true),
        headerRow: new FormControl({value: 0, disabled: true}, Validators.required),
    });
    spatialProperties: FormGroup = new FormGroup({
        xColumn: new FormControl(0, Validators.required),
        yColumn: new FormControl(1, Validators.required),
        spatialReferenceSystem: new FormControl(Projections.WGS_84),
        coordinateFormat: new FormControl({value: this.coordinateFormats[2], disabled: true}, Validators.required),
        isWkt: new FormControl(false, Validators.required),
        wktResultType: new FormControl({value: this.vectorTypes[0], disabled: true}, Validators.required),
    });
    temporalProperties: FormGroup = new FormGroup({
        intervalType: new FormControl(IntervalFormat.StartInf),
        isTime: new FormControl(false),
        startColumn: new FormControl(2),
        startFormat: new FormControl(this.timeFormats[0].value),
        endColumn: new FormControl(3),
        endFormat: new FormControl(this.timeFormats[0].value),
        constantDuration: new FormControl(0),
    });
    typingProperties: FormGroup = new FormGroup({});
    layerProperties: FormGroup = new FormGroup({});

    dialogTitle: string;
    subtitleDescription: string;

    formStatus$: BehaviorSubject<FormStatus> = new BehaviorSubject<FormStatus>(this.FormStatus.Loading);
    isDataProperties$: Observable<boolean>;
    isSpatialProperties$: Observable<boolean>;
    isTemporalProperties$: Observable<boolean>;
    isTypingProperties$: Observable<boolean>;
    isLayerProperties$: Observable<boolean>;

    storageName$ = new ReplaySubject<string>(1);
    private reservedNames$ = new BehaviorSubject<Array<string>>([]);

    @Input() data: {file: File, content: string, progress: number, configured: boolean, isNumberArray: boolean[]};
    @ViewChild('stepper') public stepper: MatStepper;
    @ViewChild('xColumnSelect') public xColumnSelect: ElementRef;
    @ViewChild('yColumnSelect') public yColumnSelect: ElementRef;

    actualPage$: BehaviorSubject<FormGroup> = new BehaviorSubject<FormGroup>(null);

    private subscriptions: Array<Subscription> = [];
    private header: {value: string}[] = [];

    constructor(private userService: UserService,
                private _changeDetectorRef: ChangeDetectorRef,
                public propertiesService: CsvPropertiesService) {
        setTimeout( () => this._changeDetectorRef.markForCheck(), 10);
        this.isDataProperties$ = this.formStatus$.pipe(map(status => status === this.FormStatus.DataProperties));
        this.isSpatialProperties$ = this.formStatus$.pipe(map(status => status === this.FormStatus.SpatialProperties));
        this.isTemporalProperties$ = this.formStatus$.pipe(map(status => status === this.FormStatus.TemporalProperties));
        this.isTypingProperties$ = this.formStatus$.pipe(map(status => status === this.FormStatus.TypingProperties));
        this.isLayerProperties$ = this.formStatus$.pipe(map(status => status === this.FormStatus.LayerProperties));

        this.userService.getFeatureDBList().pipe(
            map(entries => entries.map(entry => entry.name)))
            .subscribe(names => this.reservedNames$.next(names));

        this.layerProperties = new FormGroup({
            layerName: new FormControl('', [
                Validators.required,
                WaveValidators.notOnlyWhitespace,
                layerNameNoDuplicateValidator(this.reservedNames$),
            ]),
            onError: new FormControl('skip'),
        });
    }

    ngOnInit() {
        this.propertiesService.changeDataProperties(this.getDataPropertiesDict());
        this.propertiesService.changeSpatialProperties(this.getSpatialPropertiesDict());
        this.propertiesService.changeTemporalProperties(this.getTemporalPropertiesDict());
        this.storageName$.next(this.data.file.name);
        this.layerProperties.patchValue({layerName: this.data.file.name});
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
                    case this.FormStatus.LayerProperties:
                        this.dialogTitle = 'Layer Properties';
                        this.subtitleDescription = 'Choose on error behavior and layer name.';
                        break;
                    case this.FormStatus.Loading:
                    /* falls through */
                    default:
                        break;
                }
                this.update(10);
                setTimeout(() => this.update(10), 10);
            }),
            this.propertiesService.header$.subscribe(h => {
                this.header = h;
                // Reorder columns if needed. There might be some columns that are out of range after refactoring delimiters
                let arr = [this.spatialProperties.controls['xColumn'].value];
                if (this.spatialProperties.controls['isWkt'].value) {
                    arr.push(this.spatialProperties.controls['yColumn'].value);
                }
                if (this.temporalProperties.controls['isTime'].value) {
                    arr.push(this.temporalProperties.controls['startColumn'].value);
                    if ([this.IntervalFormat.StartEnd, this.IntervalFormat.StartDur]
                        .indexOf(this.temporalProperties.controls['endColumn'].value) >= 0) {
                        arr.push(this.temporalProperties.controls['endColumn'].value);
                    }
                }
                for (let i = 0; i < arr.length; i++) {
                    if (arr[i] >= this.header.length) {
                        this.spatialProperties.controls['xColumn'].setValue(0);
                        this.spatialProperties.controls['yColumn'].setValue(1);
                        this.temporalProperties.controls['startColumn'].setValue(2);
                        this.temporalProperties.controls['endColumn'].setValue(3);
                        break;
                    }
                }

                // Refactor user options(disable options that are not possible anymore).
                if (this.header.length < 2 && this.isSpatialVisited) {
                    this.spatialProperties.controls['isWkt'].disable();
                    this.spatialProperties.controls['isWkt'].setValue(true);
                } else {
                    this.spatialProperties.controls['isWkt'].enable();
                }
                if (this.header.length <= 2) {
                    this.temporalProperties.controls['isTime'].setValue(false);
                    this.temporalProperties.controls['isTime'].disable();
                } else if (this.header.length <= 3) {
                    if ([IntervalFormat.StartEnd, IntervalFormat.StartDur]
                            .indexOf(this.temporalProperties.controls['intervalType'].value) >= 0) {
                        this.temporalProperties.controls['intervalType'].setValue(IntervalFormat.StartInf);
                    }
                    this.temporalProperties.controls['isTime'].enable();
                } else {
                    this.temporalProperties.controls['isTime'].enable();
                }
                this._changeDetectorRef.detectChanges();
            }),
            this.dataProperties.valueChanges.subscribe(data => {
                this.propertiesService.changeDataProperties(this.getDataPropertiesDict());
            }),
            this.spatialProperties.valueChanges.subscribe(spatial => {
                this.propertiesService.changeSpatialProperties(this.getSpatialPropertiesDict());
            }),
            this.spatialProperties.controls['isWkt'].valueChanges.subscribe(wkt => {
                if (wkt) {
                    this.spatialProperties.controls['yColumn'].disable();
                    this.spatialProperties.controls['wktResultType'].enable();
                    this.propertiesService.xyColumn$.next({x: this.propertiesService.xyColumn$.getValue().x});
                } else {
                    this.spatialProperties.controls['yColumn'].enable();
                    this.spatialProperties.controls['wktResultType'].disable();
                    this.propertiesService.xyColumn$.next({x: this.spatialProperties.controls['xColumn'].value,
                        y: this.spatialProperties.controls['yColumn'].value});
                }
            }),
            this.spatialProperties.controls['xColumn'].valueChanges.subscribe(x => {
                if (!this.spatialProperties.controls['isWkt'].value) {
                    if (x === this.spatialProperties.controls['yColumn'].value) {
                        if (x === this.header.length - 1) {
                            this.spatialProperties.controls['yColumn'].setValue(this.spatialProperties.controls['yColumn'].value - 1);
                        } else {
                            this.spatialProperties.controls['yColumn'].setValue(this.spatialProperties.controls['yColumn'].value + 1);
                        }
                    }
                }
                this.correctColumns();
                if (!this.spatialProperties.controls['isWkt'].value) {
                    this.propertiesService.xyColumn$.next({x: x, y: this.spatialProperties.controls['yColumn'].value});
                } else {
                    this.propertiesService.xyColumn$.next({x: x});
                }
            }),
            this.spatialProperties.controls['yColumn'].valueChanges.subscribe(y => {
                if (y === this.spatialProperties.controls['xColumn'].value) {
                    if (y === this.header.length - 1) {
                        this.spatialProperties.controls['xColumn'].setValue(this.spatialProperties.controls['xColumn'].value - 1);
                    } else {
                        this.spatialProperties.controls['xColumn'].setValue(this.spatialProperties.controls['xColumn'].value + 1);
                    }
                }
                this.correctColumns();
                if (this.spatialProperties.controls['isWkt'].value) {
                    this.propertiesService.xyColumn$.next({x: this.spatialProperties.controls['xColumn'].value, y: y});
                } else {
                    this.propertiesService.xyColumn$.next({x: this.spatialProperties.controls['xColumn'].value});
                }
            }),
            this.temporalProperties.valueChanges.subscribe(temporal => {
                this.propertiesService.changeTemporalProperties(this.getTemporalPropertiesDict());
            }),
            this.temporalProperties.controls['startColumn'].valueChanges.subscribe(start => {
                if (start === this.temporalProperties.controls['endColumn'].value) {
                    if (start === this.header.length - 1) {
                        this.temporalProperties.controls['endColumn'].setValue(this.temporalProperties.controls['endColumn'].value - 1);
                    } else {
                        this.temporalProperties.controls['endColumn'].setValue(this.temporalProperties.controls['endColumn'].value + 1);
                    }
                }
                if (this.formStatus$.getValue() === this.FormStatus.TemporalProperties) {
                    this.propertiesService.xyColumn$.next({
                        x: start,
                        y: this.temporalProperties.controls['endColumn'].value
                    });
                }
            }),
            this.temporalProperties.controls['endColumn'].valueChanges.subscribe(end => {
                if (end === this.temporalProperties.controls['startColumn'].value) {
                    if (end === this.header.length - 1) {
                        this.temporalProperties.controls['startColumn'].setValue(this.temporalProperties.controls['startColumn'].value - 1);
                    } else {
                        this.temporalProperties.controls['startColumn'].setValue(this.temporalProperties.controls['startColumn'].value + 1);
                    }
                }
                if (this.formStatus$.getValue() === this.FormStatus.TemporalProperties) {
                    this.propertiesService.xyColumn$.next({
                        x: this.temporalProperties.controls['startColumn'].value,
                        y: end
                    });
                }
            }),
            this.temporalProperties.controls['isTime'].valueChanges.subscribe(value => {
                if (value === false) {
                    this.temporalProperties.controls['startColumn'].disable();
                    this.temporalProperties.controls['startFormat'].disable();
                    this.temporalProperties.controls['endColumn'].disable();
                    this.temporalProperties.controls['constantDuration'].disable();
                    this.temporalProperties.controls['endFormat'].disable();
                    this.temporalProperties.controls['intervalType'].disable();
                } else {
                    this.temporalProperties.controls['startColumn'].enable();
                    this.temporalProperties.controls['startFormat'].enable();
                    if (this.temporalProperties.controls['intervalType'].value !== this.IntervalFormat.StartInf) {
                        this.temporalProperties.controls['endColumn'].enable();
                        this.temporalProperties.controls['constantDuration'].enable();
                        this.temporalProperties.controls['endFormat'].enable();
                    }
                    this.temporalProperties.controls['intervalType'].enable();
                }
                if (this.formStatus$.getValue() === this.FormStatus.TemporalProperties) {
                    this.propertiesService.xyColumn$.next({x: this.temporalProperties.controls['startColumn'].value,
                        y: this.temporalProperties.controls['endColumn'].value});
                }
            }),
            this.temporalProperties.controls['intervalType'].valueChanges.subscribe(value => {
                if ([IntervalFormat.StartInf].indexOf(value) >= 0 || !this.temporalProperties.controls['isTime'].value) {
                    this.temporalProperties.controls['endFormat'].disable();
                    this.temporalProperties.controls['endColumn'].disable();
                    this.temporalProperties.controls['constantDuration'].disable();
                } else {
                    this.temporalProperties.controls['endFormat'].enable();
                    this.temporalProperties.controls['endColumn'].enable();
                    this.temporalProperties.controls['constantDuration'].enable();
                    if ([IntervalFormat.StartDur, IntervalFormat.StartConst].indexOf(value) >= 0) {
                        this.temporalProperties.controls['endFormat'].setValue(this.durationFormats[0].value);
                    } else {
                        this.temporalProperties.controls['endFormat'].setValue(this.timeFormats[0].value);
                    }
                }
                this.correctColumns();
                this.update(10);
            }),
        );
        this.formStatus$.next(this.FormStatus.DataProperties);
        this.actualPage$.next(this.dataProperties);
        this.propertiesService.changeFormStatus(this.FormStatus.DataProperties);
    }

    ngAfterViewInit() {
        this.dataProperties.updateValueAndValidity({
            onlySelf: false,
            emitEvent: true
        });
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    next(event) {
        let group: FormGroup;
        let status: FormStatus;
        switch (event.selectedIndex) {
            case 0: group = this.dataProperties;
                status = this.FormStatus.DataProperties;
                break;
            case 1:
                if (!this.isSpatialVisited) {
                    this.isSpatialVisited = true;
                    if (this.header.length < 2) {
                        this.spatialProperties.controls['isWkt'].disable();
                        this.spatialProperties.controls['isWkt'].setValue(true);
                    }
                }
                group = this.spatialProperties;
                status = this.FormStatus.SpatialProperties;
                break;
            case 2: group = this.temporalProperties;
                status = this.FormStatus.TemporalProperties;
                break;
            case 3: group = this.typingProperties;
                status = this.FormStatus.TypingProperties;
                break;
            case 4: group = this.layerProperties;
                status = this.FormStatus.LayerProperties;
                group.controls['layerName'].updateValueAndValidity();
                break;
        }
        this.propertiesService.changeFormStatus(status);
        this.actualPage$.next(group);
        this.formStatus$.next(status);
        if (status === this.FormStatus.TemporalProperties) {
            this.propertiesService.xyColumn$.next({x: this.temporalProperties.controls['startColumn'].value,
                y: this.temporalProperties.controls['endColumn'].value});
        }
        if (status === this.FormStatus.SpatialProperties) {
            this.propertiesService.xyColumn$.next({x: this.spatialProperties.controls['xColumn'].value,
                y: this.spatialProperties.controls['yColumn'].value});
        }
        this.update(100);
    }

    update(timeOut: number) {
        setTimeout(() => {
            this._changeDetectorRef.reattach();
        }, timeOut);
    }

    correctColumns() {
        let direction = 1;
        let arr = [this.spatialProperties.controls['xColumn'].value];
        if (!this.spatialProperties.controls['isWkt'].value) {
            arr.push(this.spatialProperties.controls['yColumn'].value);
        }
        if (!this.temporalProperties.controls['endColumn'].disabled) {
            arr.push(this.temporalProperties.controls['endColumn'].value);
        }
        while (arr.indexOf(this.temporalProperties.controls['startColumn'].value) >= 0) {
            if (this.temporalProperties.controls['startColumn'].value === 0) {
                direction = 1;
            } else if (this.temporalProperties.controls['startColumn'].value === this.header.length - 1) {
                direction = -1;
            }
            this.temporalProperties.controls['startColumn'].setValue(this.temporalProperties.controls['startColumn'].value + direction);
        }
        if (!this.temporalProperties.controls['endColumn'].disabled) {
            direction = 1;
            arr = [this.spatialProperties.controls['xColumn'].value,
                this.spatialProperties.controls['yColumn'].value,
                this.temporalProperties.controls['startColumn'].value];
            while (arr.indexOf(this.temporalProperties.controls['endColumn'].value) >= 0) {
                if (this.temporalProperties.controls['startColumn'].value === 0) {
                    direction = 1;
                } else if (this.temporalProperties.controls['startColumn'].value === this.header.length - 1) {
                    direction = -1;
                }
                this.temporalProperties.controls['endColumn'].setValue(this.temporalProperties.controls['endColumn'].value + direction);
            }
        }
        this.temporalProperties.updateValueAndValidity();
    }

    getDataPropertiesDict(): DataPropertiesDict {
        return {
            delimiter: this.dataProperties.controls['delimiter'].value,
            decimalSeparator: this.dataProperties.controls['decimalSeparator'].value,
            isTextQualifier: this.dataProperties.controls['isTextQualifier'].value,
            textQualifier: this.dataProperties.controls['textQualifier'].value,
            isHeaderRow: this.dataProperties.controls['isHeaderRow'].value,
            headerRow: this.dataProperties.controls['headerRow'].value,
        };
    }

    getSpatialPropertiesDict(): SpatialPropertiesDict {
        return {
            xColumn: this.spatialProperties.controls['xColumn'].value,
            yColumn: this.spatialProperties.controls['yColumn'].value,
            spatialReferenceSystem: this.spatialProperties.controls['spatialReferenceSystem'].value,
            coordinateFormat: this.spatialProperties.controls['coordinateFormat'].value,
            isWkt: this.spatialProperties.controls['isWkt'].value,
            wktResultType: this.spatialProperties.controls['wktResultType'].value,
        };
    }

    getTemporalPropertiesDict(): TemporalPropertiesDict {
        return {
            intervalType: this.temporalProperties.controls['intervalType'].value,
            isTime: this.temporalProperties.controls['isTime'].value,
            startColumn: this.temporalProperties.controls['startColumn'].value,
            startFormat: this.temporalProperties.controls['startFormat'].value,
            endColumn: this.temporalProperties.controls['endColumn'].value,
            endFormat: this.temporalProperties.controls['endFormat'].value,
            constantDuration: this.temporalProperties.controls['constantDuration'].value,
        }
    }

    get xColumnName(): string {
        if (this.spatialProperties.controls['isWkt'].value) {
            return '';
        } else {
            return this.spatialProperties.controls['spatialReferenceSystem'].value.xCoordinateName + '-';
        }
    }
}
export function layerNameNoDuplicateValidator(reservedNames: BehaviorSubject<Array<string>>): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} => {
        return reservedNames.getValue().indexOf(control.value) < 0 ? null :
            {'layerNameNoDuplicate': {value: 'Layer name already in use ' + control.value}};
    }
}
