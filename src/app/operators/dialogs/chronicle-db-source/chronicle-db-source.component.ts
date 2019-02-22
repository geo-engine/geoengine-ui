import {AfterViewInit, ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProjectService} from '../../../project/project.service';
import {RandomColorService} from '../../../util/services/random-color.service';
import {WaveValidators} from '../../../util/form.validators';
import {VectorLayer} from '../../../layers/layer.model';
import {Operator} from '../../operator.model';
import {ComplexPointSymbology} from '../../../layers/symbology/symbology.model';
import {Projections} from '../../projection.model';
import {OgrRawSourceType} from '../../types/ogr-raw-source-type.model';
import {ResultTypes} from '../../result-type.model';
import {DataTypes} from '../../datatype.model';
import {Unit} from '../../unit.model';
import {of, Observable} from 'rxjs';
import {first} from 'rxjs/operators';

// TODO: fix URLs
const CHRONICLE_DB_URL = 'http://0.0.0.0:6789/';
const QUERY_SERVICE = '_queryInput';
const SCHEMA_SERVICE = '_schemaInput';

interface AttributesReturnType {
    x?: string;
    y?: string;
    time1: string;
    time2: string;
    numeric: Array<string>;
    textual: Array<string>;
}

@Component({
    selector: 'wave-chronicle-db-source',
    templateUrl: './chronicle-db-source.component.html',
    styleUrls: ['./chronicle-db-source.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChronicleDbSourceComponent implements OnInit, AfterViewInit {

    form: FormGroup;

    constructor(private formBuilder: FormBuilder,
                private randomColorService: RandomColorService,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: ['ChronincleDB Sensor Data', [Validators.required, WaveValidators.notOnlyWhitespace]],
            queryString: ['SELECT * FROM SenseBox-Stream', Validators.required],
        });
    }

    ngAfterViewInit(): void {
        this.form.updateValueAndValidity({
            onlySelf: false,
            emitEvent: true
        });
    }

    add() {
        const layerName = this.form.controls['name'].value as string;
        const queryString = this.form.controls['queryString'].value as string;

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
                    operatorType: new OgrRawSourceType({
                        filename: `${CHRONICLE_DB_URL}/${QUERY_SERVICE}?queryString=${encodeURIComponent(queryString)}`,
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
                    }),
                    resultType: ResultTypes.POINTS,
                    projection: Projections.WGS_84,
                    attributes: attributeNames.sort(),
                    dataTypes: dataTypes,
                    units: units,
                });

                const layer = new VectorLayer({
                    name: layerName,
                    operator: operator,
                    symbology: ComplexPointSymbology.createClusterSymbology({
                        fillRGBA: this.randomColorService.getRandomColorRgba(),
                    }),
                    clustered: true,
                });

                this.projectService.addLayer(layer).subscribe(() => {
                    // console.info('LAYER ADDED!');
                });
            });
    }

    private getMetadata(queryString: string): Observable<AttributesReturnType> {
        const schemaUrl = `${CHRONICLE_DB_URL}/${SCHEMA_SERVICE}?queryString=${encodeURIComponent(queryString)}`;

        // TODO: call from remote
        console.log(`ChronicleDB schema request ${schemaUrl}`);

        return of({
            'x': '',
            'y': '',
            'time1': 't1',
            'time2': 't2',
            'numeric': ['PM2.5', 'PM10', 'REL. LUFTFEUCHTE', 'TEMPERATUR'],
            'textual': ['ID', 'TIMESTAMP']
        });
    }

}
