import {Component, ChangeDetectionStrategy, OnInit, AfterViewInit} from '@angular/core';

import {Observable, BehaviorSubject} from 'rxjs/Rx';

import {OperatorOutputNameComponent} from './operator.component';

import {LayerService} from '../../../layers/layer.service';
import {RandomColorService} from '../../../services/random-color.service';
import {MappingQueryService} from '../../../queries/mapping-query.service';

import {VectorLayer} from '../../../layers/layer.model';
import {
    AbstractVectorSymbology, ClusteredPointSymbology, SimpleVectorSymbology,
} from '../../../symbology/symbology.model';

import {Operator} from '../operator.model';
import {ResultTypes, ResultType} from '../result-type.model';
import {OperatorType} from '../operator-type.model';
import {GFBioSourceType} from '../types/gfbio-source-type.model';
import {Projections} from '../projection.model';
import {Unit} from '../unit.model';
import {DataType, DataTypes} from '../datatype.model';
import {BasicColumns} from '../../../models/csv.model';
import {Http} from '@angular/http';
import {FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';

/**
 * This component allows querying GBIF.
 */
@Component({
    selector: 'wave-gbif-loader',
    template: `
    <form [ngControl]="form" autocomplete="off">
        <md-card>
            <md-card-header>
                    <md-card-title>1. Search Species</md-card-title>
                    <md-card-subtitle>Lookup a Scientific Name</md-card-subtitle>
            </md-card-header>
            <md-card-content>
                <md-input
                    ngControl="autocompleteString"
                    placeholder="Scientific Name"
                    autocomplete="off"
                    [disabled]="mode === 2"
                ></md-input>
                <md-progress-circle
                    mode="indeterminate"
                    *ngIf="autoCompleteLoading$ | async"
                ></md-progress-circle>
                <md-radio-group
                    ngControl="searchString"
                    layout="column"
                    [style.max-height.px]="(dialog.maxHeight$ | async) / 3"
                    [disabled]="mode === 2"
                >
                    <md-radio-button
                        *ngFor="let name of autoCompleteResults$ | async"
                        [value]="name"
                    >{{name}}</md-radio-button>
                </md-radio-group>
                <button md-raised-button
                    *ngIf="mode === 1"
                    class="md-primary"
                    (click)="lookup()"
                    [disabled]="form.controls.searchString.value.length < 4"
                >Lookup</button>
                <button md-raised-button
                    *ngIf="mode === 2"
                    class="md-primary"
                    (click)="reset()"
                >Reset</button>
            </md-card-content>
        </md-card>
        <md-card *ngIf="mode === 2">
            <md-card-header>
                    <md-card-title>2. Select Resources</md-card-title>
                    <md-card-subtitle>Select different source results</md-card-subtitle>
            </md-card-header>
            <md-card-content>
                <md-progress-circle mode="indeterminate" *ngIf="loading"></md-progress-circle>
                <div layout="column">
                    <md-checkbox *ngIf="gbifCount > 0" ngControl="selectGBIF"
                    >GBIF ({{gbifCount}})</md-checkbox>
                    <md-checkbox *ngIf="iucnCount > 0" ngControl="selectIUCN"
                    >IUCN ({{iucnCount}})</md-checkbox>
                    <p *ngIf="!loading && gbifCount === 0 && iucnCount === 0">No Lookup Results</p>
                </div>
            </md-card-content>
        </md-card>
        <wave-operator-output-name ngControl="name"></wave-operator-output-name>
    </form>
    `,
    styles: [`
    md-radio-group {
        overflow-y: auto;
    }
    md-radio-button >>> .md-radio-label-content {
        float: none;
    }
    button {
        margin: 0 auto;
        width: 100%;
    }
    md-progress-circle {
        margin: 0 auto;
    }
    `],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class GBIFOperatorComponent implements OnInit, AfterViewInit {

    form: FormGroup;
    autoCompleteResults$: Observable<Array<string>>;
    autoCompleteLoading$ = new BehaviorSubject<boolean>(false);

    mode = 1;
    loading = false;

    gbifCount = 0;
    iucnCount = 0;

    private gbifColumns: BasicColumns = {numeric: [], textual: []};
    private gbifAttributes: Array<string> = [];
    private gbifUnits = new Map<string, Unit>();
    private gbifDatatypes = new Map<string, DataType>();

    private iucnColumns: BasicColumns = {numeric: [], textual: []};
    private iucnAttributes: Array<string> = [];
    private iucnUnits = new Map<string, Unit>();
    private iucnDatatypes = new Map<string, DataType>();

    private nameCustomChanged = false;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private formBuilder: FormBuilder,
        private http: Http
    ) {
        // super(layerService);

        this.form = formBuilder.group({
            autocompleteString: ['', Validators.required],
            searchString: ['', Validators.required],
            selectGBIF: [false],
            selectIUCN: [false],
            name: ['', Validators.required],
        });

        this.form.controls['searchString'].valueChanges.filter(
            _ => !this.nameCustomChanged
        ).subscribe(
            searchString => (this.form.controls['name'] as FormControl).setValue(searchString)
        );

        this.form.controls['name'].valueChanges.filter(
            _ => !this.nameCustomChanged
        ).filter(
            searchString => searchString !== this.form.controls['searchString'].value
        ).subscribe(
            _ => this.nameCustomChanged = true
        );

        this.autoCompleteResults$ = this.form.controls['autocompleteString'].valueChanges
            .debounceTime(400)
            .switchMap(
                (autocompleteString: string) => {
                    if (autocompleteString.length > 3) {
                        this.autoCompleteLoading$.next(true);
                        const promise = this.mappingQueryService.getGBIFAutoCompleteResults(
                            autocompleteString
                        );
                        promise.then(
                            _ => this.autoCompleteLoading$.next(false),
                            _ => this.autoCompleteLoading$.next(false)
                        );
                        return promise;
                    } else {
                        return Observable.of([]);
                    }
                }
            );

        this.form.controls['selectGBIF'].valueChanges.subscribe(_ => this.addAllowCheck());
        this.form.controls['selectIUCN'].valueChanges.subscribe(_ => this.addAllowCheck());

        // TODO: think about very unlikely race condition
        this.http.get('assets/gbif-default-fields.json').toPromise().then(response => {
            const fieldList: Array<{ name: string, datatype: string }> = response.json();
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

    ngOnInit() {
        // super.ngOnInit();
        //
        // this.dialog.setTitle('GBIF & IUCN Loader');
        // this.addDisabled.next(true);
    }

    ngAfterViewInit() {

    }

    lookup() {
        this.mode = 2;
        this.loading = true;

        const searchString = this.form.controls['searchString'].value;

        this.mappingQueryService.getGBIFDataSourceCounts(searchString).then(results => {
            this.loading = false;

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
            // if (totalCount > 0) {
            //     this.addDisabled.next(false);
            // }
        });
    }

    reset() {
        this.mode = 1;
        this.loading = false;
        this.gbifCount = 0;
        this.iucnCount = 0;
        (this.form.controls['selectGBIF'] as FormControl).setValue(false);
        (this.form.controls['selectIUCN'] as FormControl).setValue(false);
        // this.addDisabled.next(true);
    }

    add() {
        const layerName = this.form.controls['name'].value;
        const searchString = this.form.controls['searchString'].value;

        const sources: Array<{
            name: string, operatorType: OperatorType, resultType: ResultType
        }> = [];
        if (this.form.controls['selectIUCN'].value) {
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
        if (this.form.controls['selectGBIF'].value) {
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
                    throw 'Unexpected Result Type';
            }

            const clustered = source.resultType === ResultTypes.POINTS;
            // this.layerService.addLayer(new VectorLayer({
            //     name: `${layerName} (${source.name})`,
            //     operator: operator,
            //     symbology: symbology,
            //     data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
            //         operator, clustered,
            //     }),
            //     provenance: this.mappingQueryService.getProvenanceStream(operator),
            //     clustered: clustered,
            // }));
        }

        // this.dialog.close();
    }

    private addAllowCheck() {
        const selectGBIF = this.form.controls['selectGBIF'].value;
        const selectIUCN = this.form.controls['selectIUCN'].value;
        const atLeastOneSelected = selectGBIF || selectIUCN;

        // this.addDisabled.next(!atLeastOneSelected);
    }

}
