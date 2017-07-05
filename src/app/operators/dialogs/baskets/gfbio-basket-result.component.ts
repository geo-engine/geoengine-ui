import {Component, Input, OnInit, OnDestroy} from '@angular/core';

import {TrimPipe} from '../../../util/pipes/trim.pipe';
import {IBasketPangaeaResult, IBasketResult, IBasketGroupedAbcdResult} from './gfbio-basket.model';
import {Operator} from '../../../operators/operator.model';
import {ABCDSourceType, ABCDSourceTypeConfig} from '../../..//operators/types/abcd-source-type.model';
import {ResultTypes} from '../../../operators/result-type.model';
import {Projections} from '../../../operators/projection.model';
import {DataType, DataTypes} from '../../../operators/datatype.model';
import {VectorLayer} from '../../../layers/layer.model';
import {Unit} from '../../../operators/unit.model';
import {ClusteredPointSymbology} from '../../../layers/symbology/symbology.model';
import {MappingQueryService} from '../../../queries/mapping-query.service';
import {LayerService} from '../../../layers/layer.service';
import {RandomColorService} from '../../../util/services/random-color.service';
import {PangaeaSourceType} from '../../../operators/types/pangaea-source-type.model';
import {CsvParameters, CsvColumns, CsvColumn, BasicColumns} from './csv.model';
import {UserService} from '../../../users/user.service';
import {Subscription} from 'rxjs/Rx';
import {ProjectService} from '../../../project/project.service';

export class BasketResult<T extends IBasketResult>  {
    @Input() result: T;



    constructor(
        protected mappingQueryService: MappingQueryService,
        protected layerService: LayerService,
        protected randomColorService: RandomColorService,
        protected userService: UserService,
        protected projectService: ProjectService
    ) {

    }

    protected createAndAddLayer(operator: Operator, name: string) {
        const clustered = true;
        const layer = new VectorLayer<ClusteredPointSymbology>({
            name: name,
            operator: operator,
            symbology: new ClusteredPointSymbology({
                fillRGBA: this.randomColorService.getRandomColor(),
            }),
            // data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
            //    operator,
            //    clustered,
            // }),
            // provenance: this.mappingQueryService.getProvenanceStream(operator),
            clustered: clustered,
        });
        // this.layerService.addLayer(layer);
        this.projectService.addLayer(layer);
    }
}

@Component({
    selector: 'wave-pangaea-basket-result',
    template: `
        <md-card>            
           <md-card-title>{{result.title | waveTrimPipe}}</md-card-title>
   
           <md-card-content >
                <table class='main' >
                    <tr>
                        <td class='key'>Authors</td>
                        <td>
                            <template ngFor let-author [ngForOf]='result.authors'>
                                <span class='author'>{{author | waveTrimPipe}}</span>
                            </template>
                        </td>
                    </tr>
                    <tr>
                        <td class='key'>Data center</td> <td>{{result.dataCenter | waveTrimPipe}}</td>
                    </tr>
                    <tr>
                        <td class='key'>Metadata</td>
                         <td><a href='{{result.metadataLink | waveTrimPipe}}'>Dataset landing page</a></td>
                    </tr>

                </table>
           </md-card-content>
           <md-card-actions>
            <template [ngIf]='result.available'>
                <button md-button color='primary' (click)='addDataset()'>Add <u>dataset</u> as layer</button>
            </template>
           </md-card-actions>
           
           <template [ngIf]='!result.available'>              
                 <md-card-content>
                    <i>This dataset is currently not available in the VAT system</i>
                    <ul>
                        <li *ngIf='!result.isTabSeparated'> the data is not tab-separated </li>                  
                        <li *ngIf='!result.isGeoreferenced'> no georeference detected </li>
                    </ul>
                </md-card-content>
            </template>
        </md-card>
    `,
    styles: [`

        table {
            text-align: left;
            padding: 0;
            border-spacing: 0;
        }
        
        td .author {
            
        }
        
        td .author:not(:last-child)::after {
            content: '; ';
        }
        
        md-card {
            max-width: 100% !important;
        }
        
        md-card >>> md-card-title {
            font-size: 18px !important;
        }
        
        .main {
            width: 100%;
        }
        
        .key {
            color: darkslategray;
        }
        
        .key::after {
            content: ':';
        }

    `],
})
export class PangaeaBasketResultComponent extends BasketResult<IBasketPangaeaResult> {
    constructor(
        mappingQueryService: MappingQueryService,
        layerService: LayerService,
        randomColorService: RandomColorService,
        userService: UserService,
        projectService: ProjectService
    ) {
        super(mappingQueryService, layerService, randomColorService, userService, projectService);
    };

    createResultOperator(): Operator {
        const csvColumns: CsvColumns = {
            numeric: [],
            textual: [],
            x: '',
            y: '',
        };

        const attributes: Array<string> = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        for (let attribute of this.result.parameters) {

            if ( attribute.name.toLowerCase().indexOf('longitude') !== -1 ) {
                csvColumns.x = attribute.name;
                continue;
            }

            if ( attribute.name.toLowerCase().indexOf('latitude') !== -1 ) {
                csvColumns.y = attribute.name;
                continue;
            }

            if (attribute.numeric) {
                csvColumns.numeric.push(attribute.name);
                attributes.push(attribute.name);
                dataTypes.set(attribute.name, DataTypes.Float64); // TODO: get more accurate type
                units.set(attribute.name, Unit.defaultUnit);
            } else {
                csvColumns.textual.push(attribute.name);
                attributes.push(attribute.name);
                dataTypes.set(attribute.name, DataTypes.Alphanumeric); // TODO: get more accurate type
                units.set(attribute.name, Unit.defaultUnit);
            }
        }

        const csvParameters: CsvParameters = {
            geometry: 'xy',
            separator: '\t',
            time: 'none',
            columns: csvColumns,
            on_error: 'keep', // TODO: let the user decide on this
        };

        return new Operator({
            operatorType: new PangaeaSourceType({
                dataLink: this.result.dataLink,
                csvParameters: csvParameters,
            }),
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: attributes,
            dataTypes: dataTypes,
            units: units,
        });
    }

    addDataset() {
        this.createAndAddLayer(this.createResultOperator(), this.result.title);
    }
}

@Component({
    selector: 'wave-grouped-abcd-basket-result',
    template: `
        <md-card>            
           <md-card-title>{{result.title | waveTrimPipe}}</md-card-title>
   
           <md-card-content>
                <table class='main'>
                    <tr>
                        <td class='key'>Authors</td> 
                        <td>
                            <template ngFor let-author [ngForOf]='result.authors'>
                                <span class='author'>{{author | waveTrimPipe}}</span>
                            </template>
                        </td>
                    </tr>
                    <tr>
                        <td class='key'>Data center</td> <td>{{result.dataCenter | waveTrimPipe}}</td>
                    </tr>
                    <tr>
                        <td class='key'>Metadata</td>
                        <td><a href='{{result.metadataLink | waveTrimPipe}}'>Dataset landing page</a></td>
                    </tr>

                </table>
           </md-card-content>
           <template [ngIf]='hasUnits'>
               <md-card-content>
                    <p>Units from multiple search results based on this dataset</p>
                    <template [ngIf]='showUnits'>
                        <table class ='additional'> 
                                <tr>
                                    <th>Unit</th><th>Type</th><th>Unit id</th>
                                </tr>
                            <template ngFor let-unit [ngForOf]='result.units'>
                                <tr>
                                    <td>{{unit.prefix}}</td> <td>{{unit.type}}</td>
                                    <td><a href='{{unit.metadataLink}}'>{{unit.unitId}}</a></td>
                                </tr>
                            </template>
                        </table>
                    </template>
                    
                </md-card-content>
            </template>
           
               <md-card-actions>
                    <template [ngIf]='hasUnits' >
                        <button md-button (click)='showUnits= !showUnits'>Toggle Units</button>
                    </template>    
                    <template [ngIf]='result.available && hasUnits' >    
                        <button md-button color='primary' (click)='add(true)'>Add <u>units</u> as layer</button> 
                    </template>
                    <template [ngIf]='result.available' >                
                        <button md-button color='primary'(click)='add(false)' >Add <u>dataset</u> as layer</button>
                    </template>
               </md-card-actions>
           
           <template [ngIf]='!result.available'>              
                 <md-card-content>
                    <i>This dataset is currently not available in the VAT system</i>
                    <ul>
                        <li *ngIf='!result.isGeoreferenced'> no georeference detected </li>
                    </ul>
                </md-card-content>
            </template>          
        </md-card>
    `,
    styles: [`

        table {
            text-align: left;
            padding: 0;
            border-spacing: 0;
        }

        md-card {
            max-width: 600px !important;
        }
        
        md-card md-card-title {
            font-size: 18px !important;
        }
        
        .main {
            width: 100%;
        }
        
        td .author {
            
        }
        
        td .author:not(:last-child)::after {
            content: '; ';
        }
        
        .key {
            color: darkslategray;
        }
        
        .key::after {
            content: ':';
        }
        
        .additional {          
            width: 100%;
            font-size: 12px;
        }
        
        .additional tr:nth-child(odd) {
            background-color:darkgray;
        }
        
         .additional tr:nth-child(even) {
            background-color: lightgray;
        }
    `],
})
export class GroupedAbcdBasketResultComponent extends BasketResult<IBasketGroupedAbcdResult>
                                              implements OnInit, OnDestroy {
    showUnits = false;
    hasUnits = false;
    sourceSchema: Array<CsvColumn> = [];

    private abcdSchemaSubscription: Subscription;

    constructor(
        protected mappingQueryService: MappingQueryService,
        protected layerService: LayerService,
        protected randomColorService: RandomColorService,
        protected userService: UserService,
        protected projectService: ProjectService
    ) {
        super(mappingQueryService, layerService, randomColorService, userService, projectService);
    };

    ngOnInit() {
        this.hasUnits = this.result.units.length > 0;
        this.showUnits = this.hasUnits;
        this.abcdSchemaSubscription = this.userService.getSourceSchemaAbcd().subscribe(schema => {
            // TODO: subscribe when something might change...
            this.sourceSchema = schema;
        });
    }

    ngOnDestroy() {
        this.abcdSchemaSubscription.unsubscribe();
    }

    add(filterUnits: boolean) {

        const basicColumns: BasicColumns = {
            numeric: [],
            textual: [],
        };

        const attributes: Array<string> = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        for (let attribute of this.sourceSchema) {

            if (attribute.numeric) {
                basicColumns.numeric.push(attribute.name);
                attributes.push(attribute.name);
                dataTypes.set(attribute.name, DataTypes.Float64); // TODO: get more accurate type
                units.set(attribute.name, Unit.defaultUnit);
            } else {
                basicColumns.textual.push(attribute.name);
                attributes.push(attribute.name);
                dataTypes.set(attribute.name, DataTypes.Alphanumeric); // TODO: get more accurate type
                units.set(attribute.name, Unit.defaultUnit);
            }
        }

        const sourceTypeConfig: ABCDSourceTypeConfig = {
            provider: this.result.dataCenter,
            id: this.result.dataLink,
            columns: basicColumns,
        };

        if ( filterUnits ) {
            sourceTypeConfig.units = this.result.units.map((u) => u.unitId);
        }

        const operator = new Operator({
            operatorType: new ABCDSourceType(sourceTypeConfig),
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: attributes,
            dataTypes: dataTypes,
            units: units,
        });
        this.createAndAddLayer(operator, this.result.title);
    }
}
