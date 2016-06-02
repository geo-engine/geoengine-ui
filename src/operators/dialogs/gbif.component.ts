import {Component, ChangeDetectionStrategy, OnInit, AfterViewInit} from '@angular/core';
import {
    COMMON_DIRECTIVES, Validators, FormBuilder, ControlGroup, Control,
} from '@angular/common';

import {Observable} from 'rxjs/Rx';

import {MATERIAL_DIRECTIVES} from 'ng2-material';
import {MD_INPUT_DIRECTIVES} from '@angular2-material/input';
import {MD_RADIO_DIRECTIVES, MdRadioDispatcher} from '@angular2-material/radio';
import {MD_CHECKBOX_DIRECTIVES} from '@angular2-material/checkbox';
import {MD_PROGRESS_CIRCLE_DIRECTIVES} from '@angular2-material/progress-circle';

import {OperatorBaseComponent, OperatorOutputNameComponent} from './operator.component';

import {LayerService} from '../../layers/layer.service';
import {RandomColorService} from '../../services/random-color.service';
import {MappingQueryService} from '../../services/mapping-query.service';

import {VectorLayer} from '../../layers/layer.model';
import {
    AbstractVectorSymbology, SimplePointSymbology, SimpleVectorSymbology,
} from '../../symbology/symbology.model';

import {Operator} from '../operator.model';
import {ResultTypes, ResultType} from '../result-type.model';
import {GFBioSourceType} from '../types/gfbio-source-type.model';
import {Projections} from '../projection.model';
import {Unit} from '../unit.model';
import {DataType} from '../datatype.model';

/**
 * This component allows querying GBIF.
 */
@Component({
    selector: 'wave-gbif-loader',
    template: `
    <form [ngFormModel]="form" autocomplete="off">
        <md-card>
            <md-card-header>
                <md-card-header-text>
                    <span class="md-title">1. Search Species</span>
                    <span class="md-subheader">Lookup a Scientific Name</span>
                </md-card-header-text>
            </md-card-header>
            <md-card-content>
                <md-input
                    ngControl="autocompleteString"
                    placeholder="Scientific Name"
                    autocomplete="off"
                ></md-input>
                <md-radio-group
                    ngControl="searchString"
                    layout="column"
                    [style.max-height.px]="(dialog.maxHeight$ | async) / 3"
                >
                    <md-radio-button
                        *ngFor="let name of autoCompleteResults | async"
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
                <md-card-header-text>
                    <span class="md-title">2. Select Resources</span>
                    <span class="md-subheader">Select different source results</span>
                </md-card-header-text>
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
    button {
        margin: 0 auto;
        width: 100%;
    }
    md-progress-circle {
        margin: 0 auto;
    }
    `],
    directives: [
        COMMON_DIRECTIVES, MATERIAL_DIRECTIVES,
        MD_INPUT_DIRECTIVES, MD_RADIO_DIRECTIVES, MD_CHECKBOX_DIRECTIVES,
        MD_PROGRESS_CIRCLE_DIRECTIVES,
        OperatorOutputNameComponent,
    ],
    providers: [
        MdRadioDispatcher,
    ],
    changeDetection: ChangeDetectionStrategy.Default,
})
export class GBIFOperatorComponent extends OperatorBaseComponent implements OnInit, AfterViewInit {

    form: ControlGroup;
    autoCompleteResults: Observable<Array<string>>;

    mode = 1;
    loading = false;

    gbifCount = 0;
    iucnCount = 0;

    private nameCustomChanged = false;

    constructor(
        layerService: LayerService,
        private randomColorService: RandomColorService,
        private mappingQueryService: MappingQueryService,
        private formBuilder: FormBuilder
    ) {
        super(layerService);

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
            searchString => (this.form.controls['name'] as Control).updateValue(searchString)
        );

        this.form.controls['name'].valueChanges.filter(
            _ => !this.nameCustomChanged
        ).filter(
            searchString => searchString !== this.form.controls['searchString'].value
        ).subscribe(
            _ => this.nameCustomChanged = true
        );

        this.autoCompleteResults = this.form.controls['autocompleteString'].valueChanges.switchMap(
            (autocompleteString: string) => {
                if (autocompleteString.length > 3) {
                    return this.mappingQueryService.getGBIFAutoCompleteResults(autocompleteString);
                } else {
                    return Observable.of([]);
                }
            }
        );

        this.form.controls['selectGBIF'].valueChanges.subscribe(_ => this.addAllowCheck());
        this.form.controls['selectIUCN'].valueChanges.subscribe(_ => this.addAllowCheck());
    }

    ngOnInit() {
        super.ngOnInit();

        this.dialog.setTitle('GBIF & IUCN Loader');
        this.addDisabled.next(true);
    }

    ngAfterViewInit() {

    }

    lookup() {
        this.mode = 2;
        this.loading = true;

        const searchString = this.form.controls['searchString'].value;
        const query = JSON.stringify({
            globalAttributes: {
                speciesName: searchString,
            },
            localAttributes: {},
        });

        this.mappingQueryService.getGBIFDataSourceCounts(query).then(results => {
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
        (this.form.controls['selectGBIF'] as Control).updateValue(false);
        (this.form.controls['selectIUCN'] as Control).updateValue(false);
        this.addDisabled.next(true);
    }

    add() {
        const layerName = this.form.controls['name'].value;
        const searchString = this.form.controls['searchString'].value;

        const query = JSON.stringify({
            globalAttributes: {
                speciesName: searchString,
            },
            localAttributes: {},
        });

        const sources: Array<{name: string, resultType: ResultType}> = [];
        if (this.form.controls['selectGBIF'].value) {
            sources.push({name: 'GBIF', resultType: ResultTypes.POINTS});
        }
        if (this.form.controls['selectIUCN'].value) {
            sources.push({name: 'IUCN', resultType: ResultTypes.POLYGONS});
        }

        for (const source of sources) {
            const operator = new Operator({
                operatorType: new GFBioSourceType({
                    datasource: source.name,
                    query: query,
                }),
                resultType: source.resultType,
                projection: Projections.WGS_84,
                attributes: [],
                dataTypes: new Map<string, DataType>(),
                units: new Map<string, Unit>(),
            });

            let symbology: AbstractVectorSymbology;
            switch (source.resultType) {
                case ResultTypes.POINTS:
                    symbology = new SimplePointSymbology({
                        fill_rgba: this.randomColorService.getRandomColor(),
                    });
                    break;
                case ResultTypes.POLYGONS:
                    symbology = new SimpleVectorSymbology({
                        fill_rgba: this.randomColorService.getRandomColor(),
                    });
                    break;
                default:
                    throw 'Unexpected Result Type';
            }

            this.layerService.addLayer(new VectorLayer({
                name: `${layerName} (${source.name})`,
                operator: operator,
                symbology: symbology,
                data$: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection(
                    operator
                ),
                prov$: this.mappingQueryService.getProvenanceStream(operator),
            }));
        }

        this.dialog.close();
    }

    private addAllowCheck() {
        const selectGBIF = this.form.controls['selectGBIF'].value;
        const selectIUCN = this.form.controls['selectIUCN'].value;
        const atLeastOneSelected = selectGBIF || selectIUCN;

        this.addDisabled.next(!atLeastOneSelected);
    }

}
