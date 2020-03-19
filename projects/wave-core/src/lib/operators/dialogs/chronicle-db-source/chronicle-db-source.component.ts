import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {RandomColorService} from '../../../util/services/random-color.service';
import {WaveValidators} from '../../../util/form.validators';
import {VectorLayer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {LineSymbology, PointSymbology, VectorSymbology} from '../../../layers/symbology/symbology.model';
import {Projections} from '../../projection.model';
import {ResultType, ResultTypes} from '../../result-type.model';
import {DataTypes} from '../../datatype.model';
import {Unit} from '../../unit.model';
import {concat, Observable, of} from 'rxjs';
import {distinctUntilChanged, first, map} from 'rxjs/operators';
import {Config} from '../../../config.service';
import {HttpClient} from '@angular/common/http';
import {ChronicleDBSourceType} from '../../types/chronicle-db-source-type.model';
import {NotificationService} from '../../../notification.service';

const QUERY_SERVICE = '_queryInput';
const SCHEMA_SERVICE = '_schemaInput';

interface AttributesReturnType {
    x?: string;
    y?: string;
    time1: string;
    time2: string;
    numeric: Array<string>;
    textual: Array<string>;
    provenance?: {
        citation: string;
        license: string;
        uri: string;
    };
}

@Component({
    selector: 'wave-chronicle-db-source',
    templateUrl: './chronicle-db-source.component.html',
    styleUrls: ['./chronicle-db-source.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChronicleDbSourceComponent implements OnInit {

    @Input() copyFrom: Operator = undefined;

    form: FormGroup;

    validResultTypes: Array<ResultType> = [ResultTypes.POINTS, ResultTypes.LINES, ResultTypes.POLYGONS];
    resultTypeIsPoints$: Observable<boolean>;
    isFormInvalid$: Observable<boolean>;

    constructor(private config: Config,
                private formBuilder: FormBuilder,
                private http: HttpClient,
                private randomColorService: RandomColorService,
                private notificationService: NotificationService,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: ['ChronicleDB Sensor Data', [Validators.required, WaveValidators.notOnlyWhitespace]],
            queryString: ['SELECT * FROM SenseBoxStream', Validators.required],
            resultType: [ResultTypes.POINTS, Validators.required],
            clustered: [true, Validators.required],
        });

        if (this.copyFrom) {
            this.setupWithExistingOperator(this.copyFrom);
        }

        this.resultTypeIsPoints$ = this.initResultTypeIsPoints();
        this.isFormInvalid$ = this.initIsFormInvalid();
    }

    private setupWithExistingOperator(operator: Operator) {
        const type = operator.operatorType as ChronicleDBSourceType;
        const config = type.config;
        this.form.get('queryString').setValue(config.query_string);
        this.form.get('resultType').setValue(operator.resultType);
        // cannot update `name` and `clustered` because information is missing in the operator
    }

    private initResultTypeIsPoints(): Observable<boolean> {
        const formControl = this.form.get('resultType');
        const originalValue = of(formControl.value as ResultType);
        const updatedValues = this.form.get('resultType').valueChanges as Observable<ResultType>;
        return concat(originalValue, updatedValues).pipe(
            map((resultType: ResultType) => resultType === ResultTypes.POINTS),
        );
    }

    private initIsFormInvalid(): Observable<boolean> {
        const originalValue = of(!this.form.valid);
        const updatedValues = this.form.statusChanges.pipe(
            distinctUntilChanged(),
            map(() => !this.form.valid)
        );
        return concat(originalValue, updatedValues);
    }

    add() {
        const chronicleDbUrl = this.config.EMERGENCITY.CHRONICLE_DB_URL;

        const layerName = this.form.controls['name'].value as string;
        const queryString = this.form.controls['queryString'].value as string;
        const resultType = this.form.controls['resultType'].value as ResultType;
        const clustered = (this.form.controls['clustered'].value as boolean) && (resultType === ResultTypes.POINTS);

        this.getMetadata(queryString)
            .pipe(first())
            .subscribe(metadata => {
                const attributeNames = [];
                const dataTypes = new Map();
                const units = new Map();
                for (const attribute of metadata.numeric) {
                    attributeNames.push(attribute);
                    dataTypes.set(attribute, DataTypes.Float64);
                    units.set(attribute, Unit.defaultUnit);
                }
                for (const attribute of metadata.textual) {
                    attributeNames.push(attribute);
                    dataTypes.set(attribute, DataTypes.Alphanumeric);
                    units.set(attribute, Unit.defaultUnit);
                }

                const operator = new Operator({
                    operatorType: new ChronicleDBSourceType({
                        filename: `${chronicleDbUrl}/${QUERY_SERVICE}?queryString=${encodeURIComponent(queryString)}`,
                        query_string: queryString,
                        time: 'start+end',
                        time1_format: {
                            format: 'seconds',
                        },
                        time2_format: {
                            format: 'seconds',
                        },
                        columns: {
                            time1: metadata.time1,
                            time2: metadata.time2,
                            numeric: metadata.numeric,
                            textual: metadata.textual,
                        },
                        on_error: 'skip',
                        provenance: metadata.provenance,
                    }),
                    resultType,
                    projection: Projections.WGS_84,
                    attributes: attributeNames.sort(),
                    dataTypes,
                    units,
                });

                let symbology;
                switch (resultType) {
                    case ResultTypes.POINTS:
                        if (clustered) {
                            symbology = PointSymbology.createClusterSymbology({
                                fillRGBA: this.randomColorService.getRandomColorRgba(),
                            });
                        } else {
                            symbology = PointSymbology.createSymbology({
                                fillRGBA: this.randomColorService.getRandomColorRgba(),
                            });
                        }
                        break;
                    case ResultTypes.LINES:
                        symbology = LineSymbology.createSymbology({
                            fillRGBA: this.randomColorService.getRandomColorRgba(),
                        });
                        break;
                    case ResultTypes.POLYGONS:
                        symbology = VectorSymbology.createSymbology({
                            fillRGBA: this.randomColorService.getRandomColorRgba(),
                        });
                        break;
                    default:
                        throw new Error(`Unknown result data type ${resultType.toString()}`);
                }

                const layer = new VectorLayer({
                    name: layerName,
                    operator,
                    symbology,
                    clustered,
                });

                this.projectService.addLayer(layer).subscribe(() => {
                    this.notificationService.info(`ChronicleDB Layer »${layer.name}« added.`);
                });
            });
    }

    private getMetadata(queryString: string): Observable<AttributesReturnType> {
        const chronicleDbUrl = this.config.EMERGENCITY.CHRONICLE_DB_URL;

        const schemaUrl = `${chronicleDbUrl}/${SCHEMA_SERVICE}?queryString=${encodeURIComponent(queryString)}`;

        return this.http.get<AttributesReturnType>(schemaUrl);
    }
}
