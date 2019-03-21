
import {BehaviorSubject, Observable, Subscription, of as observableOf} from 'rxjs';
import {mergeMap, distinctUntilChanged, throttleTime, startWith} from 'rxjs/operators';

import {AfterViewInit, ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Config} from '../../../config.service';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {OperatorType} from '../../operator-type.model';
import {ResultType, ResultTypes} from '../../result-type.model';
import {GFBioSourceType} from '../../types/gfbio-source-type.model';
import {Operator} from '../../operator.model';
import {Projections} from '../../projection.model';
import {
    AbstractVectorSymbology,
    ComplexPointSymbology,
    ComplexVectorSymbology
} from '../../../layers/symbology/symbology.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {BasicColumns} from '../baskets/csv.model';
import {Unit} from '../../unit.model';
import {DataType, DataTypes} from '../../datatype.model';
import {HttpClient} from '@angular/common/http';
import {LayerService} from '../../../layers/layer.service';
import {VectorLayer} from '../../../layers/layer.model';
import {UnexpectedResultType} from '../../../util/errors';
import {MatAutocompleteTrigger} from '@angular/material';
import {ProjectService} from '../../../project/project.service';

function oneIsTrue(group: FormGroup): { [key: string]: boolean } {
    const errors: {
        noneIsTrue?: boolean,
    } = {};

    let noneIsTrue = true;
    for (const key in group.controls) {
        if (group.controls[key].value as boolean) {
            noneIsTrue = false;
            break;
        }
    }
    if (noneIsTrue) {
        errors.noneIsTrue = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
}

enum Mode {
    SEARCH = 1,
    SELECT = 2,
}

@Component({
    selector: 'wave-gbif-operator',
    templateUrl: './gbif-operator.component.html',
    styleUrls: ['./gbif-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GbifOperatorComponent implements OnInit, AfterViewInit, OnDestroy {

    Mode = Mode;

    form: FormGroup;

    @ViewChild(MatAutocompleteTrigger) autoCompleteTrigger: MatAutocompleteTrigger;

    mode$ = new BehaviorSubject(1);
    loading$ = new BehaviorSubject(false);

    minSearchLength = 4;
    autoCompleteResults$: Observable<Array<string>>;

    gbifCount: number;
    iucnCount: number;

    taxonLevels: Array<string> = ['Species', 'Genus', 'Family'];

    private gbifColumns: BasicColumns = {numeric: [], textual: []};
    private gbifAttributes: Array<string> = [];
    private gbifUnits = new Map<string, Unit>();
    private gbifDatatypes = new Map<string, DataType>();

    private iucnColumns: BasicColumns = {numeric: [], textual: []};
    private iucnAttributes: Array<string> = [];
    private iucnUnits = new Map<string, Unit>();
    private iucnDatatypes = new Map<string, DataType>();

    private subscriptions: Array<Subscription> = [];

    constructor(private config: Config,
                private mappingQueryService: MappingQueryService,
                private formBuilder: FormBuilder,
                private randomColorService: RandomColorService,
                private http: HttpClient,
                private layerService: LayerService,
                private projectService: ProjectService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: [undefined, Validators.required],
            searchTerm: [undefined, Validators.required],
            searchLevel: [this.taxonLevels[0], Validators.required],
            select: this.formBuilder.group({
                gbif: [false],
                iucn: [false],
            }, {
                validator: oneIsTrue
            }),
        });

        this.subscriptions.push(
            this.mode$.subscribe(mode => {
                if (mode === Mode.SEARCH) {
                    this.form.controls['searchTerm'].enable();
                    this.form.controls['searchLevel'].enable();
                } else {
                    this.form.controls['searchTerm'].disable();
                    this.form.controls['searchLevel'].disable();
                }
            })
        );

        this.autoCompleteResults$ = this.form.controls['searchTerm'].valueChanges.pipe(
            startWith(null),
            throttleTime(this.config.DELAYS.DEBOUNCE),
            distinctUntilChanged(),
            mergeMap(
                (autocompleteString: string) => {
                    if (autocompleteString && autocompleteString.length >= this.minSearchLength) {
                        return this.mappingQueryService.getGBIFAutoCompleteResults(
                            this.form.controls['searchLevel'].value,
                            autocompleteString
                        );
                    } else {
                        return observableOf([]);
                    }
                }
            ), );

        // TODO: think about very unlikely race condition
        this.http
            .get<Array<{ name: string, datatype: string }>>('assets/gbif-default-fields.json')
            .toPromise()
            .then(fieldList => {
                for (const field of fieldList) {
                    this.gbifAttributes.push(field.name);

                    const datatype = DataTypes.fromCode(field.datatype);
                    if (DataTypes.ALL_NUMERICS.indexOf(datatype) >= 0) {
                        this.gbifColumns.numeric.push(field.name);
                    } else {
                        this.gbifColumns.textual.push(field.name);
                    }

                    this.gbifDatatypes.set(field.name, datatype);
                    this.gbifUnits.set(field.name, Unit.defaultUnit);
                }
            });
    }

    ngAfterViewInit() {
        setTimeout(() => this.form.updateValueAndValidity(), 0);
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    lookup() {
        this.mode$.next(2);
        this.loading$.next(true);

        const searchLevel = this.form.controls['searchLevel'].value as string;
        const searchTerm = this.form.controls['searchTerm'].value as string;

        this.mappingQueryService.getGBIFDataSourceCounts(searchLevel, searchTerm).then(results => {
            this.loading$.next(false);

            let totalCount = 0;
            for (const result of results) {
                switch (result.name) {
                    case 'GBIF':
                        this.gbifCount = result.count;
                        break;
                    case 'IUCN':
                        this.iucnCount = result.count;
                        break;
                    default:
                    // ignore
                }
                totalCount += result.count;
            }
        });

        this.autoCompleteTrigger.closePanel();
    }

    reset() {
        this.mode$.next(1);
        this.loading$.next(false);

        this.gbifCount = 0;
        this.iucnCount = 0;

        this.form.controls['searchLevel'].setValue('Species');
        this.form.controls['searchTerm'].setValue('');

        this.form.controls['select'].setValue({
            gbif: false,
            iucn: false,
        });
    }

    add(event: any) {
        const layerName = this.form.controls['name'].value as string;
        const searchLevel = this.form.controls['searchLevel'].value as string;
        const searchTerm = this.form.controls['searchTerm'].value as string;


        const sources: Array<{
            name: string, operatorType: OperatorType, resultType: ResultType
        }> = [];
        if (this.form.controls['select'].value.iucn) {
            sources.push({
                name: 'IUCN',
                operatorType: new GFBioSourceType({
                    dataSource: 'IUCN',
                    level: searchLevel,
                    term: searchTerm,
                    columns: this.iucnColumns,
                }),
                resultType: ResultTypes.POLYGONS,
            });
        }
        if (this.form.controls['select'].value.gbif) {
            sources.push({
                name: 'GBIF',
                operatorType: new GFBioSourceType({
                    dataSource: 'GBIF',
                    level: searchLevel,
                    term: searchTerm,
                    columns: this.gbifColumns,
                }),
                resultType: ResultTypes.POINTS,
            });
        }

        for (const source of sources) {
            const operator = new Operator({
                operatorType: source.operatorType,
                resultType: source.resultType,
                projection: Projections.WGS_84,
                attributes: source.name === 'GBIF' ? this.gbifAttributes : this.iucnAttributes,
                dataTypes: source.name === 'GBIF' ? this.gbifDatatypes : this.iucnDatatypes,
                units: source.name === 'GBIF' ? this.gbifUnits : this.iucnUnits,
            });

            let symbology: AbstractVectorSymbology;
            switch (source.resultType) {
                case ResultTypes.POINTS:
                    symbology = ComplexPointSymbology.createClusterSymbology({
                        fillRGBA: this.randomColorService.getRandomColorRgba(),
                    });
                    break;
                case ResultTypes.POLYGONS:
                    symbology = ComplexVectorSymbology.createSimpleSymbology({
                        fillRGBA: this.randomColorService.getRandomColorRgba(),
                    });
                    break;
                default:
                    throw new UnexpectedResultType();
            }

            const clustered = source.resultType === ResultTypes.POINTS;
            const layer = new VectorLayer({
                name: `${layerName} (${source.name})`,
                operator: operator,
                symbology: symbology,
                clustered: clustered,
            });

            this.projectService.addLayer(layer);
        }

    }

}
