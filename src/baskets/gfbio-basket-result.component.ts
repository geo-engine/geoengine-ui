import {Component, Input, OnInit} from '@angular/core';
import {MD_CARD_DIRECTIVES} from '@angular2-material/card/card';
import {MdButton} from '@angular2-material/button';
import {CORE_DIRECTIVES} from '@angular/common';

import {TrimPipe} from '../pipes/trim.pipe';
import {IBasketPangaeaResult, IBasketResult, IBasketGroupedAbcdResult} from './gfbio-basket.model';
import {Operator} from '../operators/operator.model';
import {ABCDSourceType} from '../operators/types/abcd-source-type.model';
import {ResultTypes} from '../operators/result-type.model';
import {Projections} from '../operators/projection.model';
import {DataType} from '../operators/datatype.model';
import {VectorLayer} from '../layers/layer.model';
import {Unit} from '../operators/unit.model';
import {SimplePointSymbology} from '../symbology/symbology.model';
import {MappingQueryService} from '../queries/mapping-query.service';
import {LayerService} from '../layers/layer.service';
import {RandomColorService} from '../services/random-color.service';
import {PangaeaSourceType} from '../operators/types/pangaea-source-type.model';

export class BasketResult<T extends IBasketResult>  {
    @Input() result: T;

    mappingQueryService: MappingQueryService;
    layerService: LayerService;
    randomColorService: RandomColorService;

    constructor(
        mappingQueryService: MappingQueryService,
        layerService: LayerService,
        randomColorService: RandomColorService
    ) {
        this.mappingQueryService = mappingQueryService;
        this.layerService = layerService;
        this.randomColorService = randomColorService;
    }

    protected createAndAddLayer(operator: Operator, name: string){
        const layer = new VectorLayer<SimplePointSymbology>({
            name: name,
            operator: operator,
            symbology: new SimplePointSymbology({
                fillRGBA: this.randomColorService.getRandomColor(),
            }),
            data: this.mappingQueryService.getWFSDataStreamAsGeoJsonFeatureCollection({
                operator,
            }),
            provenance: this.mappingQueryService.getProvenanceStream(operator),
        });
        this.layerService.addLayer(layer);

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
            max-width: 600px !important;
        }
        
        md-card md-card-title {
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
    pipes: [TrimPipe],
    directives: [CORE_DIRECTIVES, MD_CARD_DIRECTIVES, MdButton],
})
export class PangaeaBasketResult extends BasketResult<IBasketPangaeaResult> {
    constructor(
        mappingQueryService: MappingQueryService,
        layerService: LayerService,
        randomColorService: RandomColorService
    ) {
        super(mappingQueryService, layerService, randomColorService);
    };

    createResultOperator(): Operator {
        return new Operator({
            operatorType: new PangaeaSourceType({
                dataLink: this.result.dataLink,
            }),
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
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
                        <button md-button color='primary' (click)='addUnits()'>Add <u>units</u> as layer</button> 
                    </template>
                    <template [ngIf]='result.available' >                
                        <button md-button color='primary'(click)='addDataset()' >Add <u>dataset</u> as layer</button>
                    </template>
               </md-card-actions>
           
           <template [ngIf]='!result.available'>              

                 <md-card-content>
                    <i>This dataset is currently not available in the VAT system</i>
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
    pipes: [TrimPipe],
    directives: [CORE_DIRECTIVES, MD_CARD_DIRECTIVES, MdButton],
})
export class GroupedAbcdBasketResult extends BasketResult<IBasketGroupedAbcdResult> implements OnInit {
    showUnits: boolean = false;
    hasUnits: boolean = false;

    constructor(
        mappingQueryService: MappingQueryService,
        layerService: LayerService,
        randomColorService: RandomColorService
    ) {
        super(mappingQueryService, layerService, randomColorService);
    };

    ngOnInit() {
        this.hasUnits = this.result.units.length > 0;
        this.showUnits = this.hasUnits;
    }

    createResultOperator(): Operator {
        return new Operator({
            operatorType: new ABCDSourceType({
                provider: this.result.dataCenter,
                id: this.result.dataLink,
            }),
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });
    }

    addDataset() {
        this.createAndAddLayer(this.createResultOperator(), this.result.title);
    }

    addUnits() {
        const operator = new Operator({
            operatorType: new ABCDSourceType({
                provider: this.result.dataCenter,
                id: this.result.dataLink,
                units: this.result.units.map((u) => u.unitId),
            }),
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: ['value'],
            dataTypes: new Map<string, DataType>(),
            units: new Map<string, Unit>(),
        });
        this.createAndAddLayer(operator, this.result.title);
    }

}