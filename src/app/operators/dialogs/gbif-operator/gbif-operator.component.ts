import {Component, OnInit, ChangeDetectionStrategy, AfterViewInit, OnDestroy} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Observable, BehaviorSubject, Subscription} from 'rxjs/Rx';
import {Config} from '../../../config.service';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {OperatorType} from '../../operator-type.model';
import {ResultType, ResultTypes} from '../../result-type.model';
import {GFBioSourceType} from '../../types/gfbio-source-type.model';
import {Operator} from '../../operator.model';
import {Projections} from '../../projection.model';
import {
    AbstractVectorSymbology, ClusteredPointSymbology,
    SimpleVectorSymbology
} from '../../../layers/symbology/symbology.model';
import {RandomColorService} from '../../../util/services/random-color.service';
import {BasicColumns} from '../baskets/csv.model';
import {Unit} from '../../unit.model';
import {DataType, DataTypes} from '../../datatype.model';
import {Http} from '@angular/http';
import {LayerService} from '../../../layers/layer.service';
import {VectorLayer} from '../../../layers/layer.model';
import {UnexpectedResultType} from '../../../util/errors';

function oneIsTrue(group: FormGroup): {[key: string]: boolean} {
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

    mode$ = new BehaviorSubject(1);
    loading$ = new BehaviorSubject(false);

    minSearchLength = 4;
    autoCompleteResults$: Observable<Array<string>>;

    gbifCount: number;
    iucnCount: number;

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
                private http: Http,
                private layerService: LayerService) {
    }

    ngOnInit() {
        this.form = this.formBuilder.group({
            name: [undefined, Validators.required],
            searchString: [undefined, Validators.required],
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
                    this.form.controls['searchString'].enable();
                } else {
                    this.form.controls['searchString'].disable();
                }
            })
        );

        this.autoCompleteResults$ = this.form.controls['searchString'].valueChanges
            .startWith(null)
            .throttleTime(this.config.DELAYS.DEBOUNCE)
            .distinctUntilChanged()
            .mergeMap(
                (autocompleteString: string) => {
                    if (autocompleteString && autocompleteString.length >= this.minSearchLength) {
                        return this.mappingQueryService.getGBIFAutoCompleteResults(
                            autocompleteString
                        );
                    } else {
                        return Observable.of([]);
                    }
                }
            );

        // TODO: think about very unlikely race condition
        this.http.get('assets/gbif-default-fields.json').toPromise().then(response => {
            const fieldList: Array<{name: string, datatype: string}> = response.json();
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

        const searchString = this.form.controls['searchString'].value as string;

        this.mappingQueryService.getGBIFDataSourceCounts(searchString).then(results => {
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
    }

    reset() {
        this.mode$.next(1);
        this.loading$.next(false);

        this.gbifCount = 0;
        this.iucnCount = 0;

        this.form.controls['searchString'].setValue('');

        this.form.controls['select'].setValue({
            gbif: false,
            iucn: false,
        });
    }

    add() {
        const layerName = this.form.controls['name'].value as string;
        const searchString = this.form.controls['searchString'].value as string;

        const sources: Array<{
            name: string, operatorType: OperatorType, resultType: ResultType
        }> = [];
        if (this.form.controls['select'].value.iucn) {
            sources.push({
                name: 'IUCN',
                operatorType: new GFBioSourceType({
                    dataSource: 'IUCN',
                    scientificName: searchString,
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
                    scientificName: searchString,
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
                    symbology = new ClusteredPointSymbology({
                        fillRGBA: this.randomColorService.getRandomColor(),
                    });
                    break;
                case ResultTypes.POLYGONS:
                    symbology = new SimpleVectorSymbology({
                        fillRGBA: this.randomColorService.getRandomColor(),
                    });
                    break;
                default:
                    throw new UnexpectedResultType();
            }

            const clustered = source.resultType === ResultTypes.POINTS;
            this.layerService.addLayer(new VectorLayer({
                name: `${layerName} (${source.name})`,
                operator: operator,
                symbology: symbology,
                data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                    operator, clustered,
                }),
                provenance: this.mappingQueryService.getProvenanceStream(operator),
                clustered: clustered,
            }));
        }

    }

}
