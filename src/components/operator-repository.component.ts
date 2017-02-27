import {Component, ChangeDetectionStrategy} from '@angular/core';

import {RasterValueExtractionType} from '../app/operators/types/raster-value-extraction-type.model';

import {NumericAttributeFilterType} from '../app/operators/types/numeric-attribute-filter-type.model';
import {
    NumericAttributeFilterOperatorComponent
} from '../app/operators/dialogs/numeric-attribute-filter/numeric-attribute-filter.component';

import {PointInPolygonFilterType} from '../app/operators/types/point-in-polygon-filter-type.model';
import {PointInPolygonFilterOperatorComponent} from '../app/operators/dialogs/point-in-polygon-filter/point-in-polygon-filter.component';

import {ExpressionOperatorComponent} from '../app/operators/dialogs/expression-operator/expression-operator.component';
import {ExpressionType} from '../app/operators/types/expression-type.model';

import {HistogramType} from '../app/operators/types/histogram-type.model';
import {RScriptType} from '../app/operators/types/r-script-type.model';
import {
    MsgRadianceType,
    MsgPansharpenType,
    MsgReflectanceType,
    MsgSolarangleType,
    MsgTemperatureType,
    MsgCo2CorrectionType
} from '../app/operators/types/msg-types.model';
import {MdDialog} from '@angular/material';
import {RasterValueExtractionOperatorComponent} from '../app/operators/dialogs/raster-value-extraction/raster-value-extraction.component';
import {HistogramOperatorComponent} from '../app/operators/dialogs/histogram-operator/histogram-operator.component';

@Component({
    selector: 'wave-operator-repository',
    template: `
    <div style="height: 100%;" fxLayout='column'>
    <div fxFlex>
      <md-toolbar>
        <label>Operators</label>            
        <span fxFlex></span>
        <md-icon>search</md-icon>
        <md-input-container>
          <input mdInput placeholder="Operator" type="text" disabled>
        </md-input-container>
      </md-toolbar>
      <md-list>      
            <h3 md-subheader class="operator_group">
                Vector
            </h3>
                <md-list-item>    
                    <p md-line (click)="dialog.open(RasterValueExtractionOperatorComponent)">
                        {{RasterValueExtractionType.NAME}}                       
                    </p>
              </md-list-item>
              <md-divider></md-divider>
              <md-list-item>    
                    <p md-line (click)="dialog.open(NumericAttributeFilterOperatorComponent)">                  
                        {{NumericAttributeFilterType.NAME}}                       
                    </p>
              </md-list-item>
              <md-divider></md-divider>
              <md-list-item>    
                    <p md-line (click)="dialog.open(PointInPolygonFilterOperatorComponent)">                  
                        {{PointInPolygonFilterType.NAME}}                       
                    </p>
              </md-list-item>

            <h3 md-subheader class="operator_group">
                Raster
            </h3>
            <md-list-item>    
                    <p md-line (click)="dialog.open(ExpressionOperatorComponent)">
                        {{ExpressionType.NAME}}                       
                    </p>
              </md-list-item>
            
            <h3 md-subheader class="operator_group">
                Plots
            </h3>
            <md-list-item>    
                    <p md-line (click)="dialog.open(HistogramOperatorComponent)">
                        {{HistogramType.NAME}}                       
                    </p>
              </md-list-item>
        
            <h3 md-subheader class="operator_group">
                Mixed
            </h3>
            <md-list-item>    
                    <p md-line>
                        <!--(click)="rOperatorComponentDialog.show()">-->
                        {{RScriptType.NAME}}                       
                    </p>
              </md-list-item>    
                
            <h3 md-subheader class="operator_group">
                MSG
            </h3>
            <md-list-item>    
                    <p md-line>
                        <!--(click)="rOperatorComponentDialog.show()">-->
                        {{MsgRadianceType.NAME}}                       
                    </p>
              </md-list-item>   
              <md-divider></md-divider>
              <md-list-item>    
                    <p md-line>
                        <!--(click)="rOperatorComponentDialog.show()">-->
                        {{MsgReflectanceType.NAME}}                       
                    </p>
              </md-list-item>   
              <md-divider></md-divider>
             <md-list-item>    
                    <p md-line>
                        <!--(click)="rOperatorComponentDialog.show()">-->
                        {{MsgSolarangleType.NAME}}                       
                    </p>
              </md-list-item>   
              <md-divider></md-divider>
              <md-list-item>    
                    <p md-line>
                        <!--(click)="rOperatorComponentDialog.show()">-->
                        {{MsgTemperatureType.NAME}}                       
                    </p>
              </md-list-item>   
              <md-divider></md-divider>
              <md-list-item>    
                    <p md-line>
                        <!--(click)="rOperatorComponentDialog.show()">-->
                        {{MsgPansharpenType.NAME}}                       
                    </p>
              </md-list-item>   
              <md-divider></md-divider>
              <md-list-item>    
                    <p md-line>
                        <!--(click)="rOperatorComponentDialog.show()">-->
                        {{MsgCo2CorrectionType.NAME}}                       
                    </p>
              </md-list-item>   
      </md-list>
    </div>
    </div>
    `,
    styles: [`
    .operator_group {
        color: white;
        background-color: #009688;
    }
        
    .searchInput {
        width: 100%;
    }
    md-list-item {
        cursor: pointer;
    }
    
    .secondary_action {
        float: right;
    }

    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class OperatorRepositoryComponent {

    RasterValueExtractionOperatorComponent = RasterValueExtractionOperatorComponent;
    RasterValueExtractionType = RasterValueExtractionType;

    NumericAttributeFilterOperatorComponent = NumericAttributeFilterOperatorComponent;
    NumericAttributeFilterType = NumericAttributeFilterType;

    PointInPolygonFilterOperatorComponent = PointInPolygonFilterOperatorComponent;
    PointInPolygonFilterType = PointInPolygonFilterType;

    ExpressionOperatorComponent = ExpressionOperatorComponent;
    ExpressionType = ExpressionType;

    HistogramOperatorComponent = HistogramOperatorComponent;
    HistogramType = HistogramType;

    RScriptType = RScriptType;
    MsgRadianceType = MsgRadianceType;
    MsgPansharpenType = MsgPansharpenType;
    MsgReflectanceType = MsgReflectanceType;
    MsgSolarangleType = MsgSolarangleType;
    MsgTemperatureType = MsgTemperatureType;
    MsgCo2CorrectionType = MsgCo2CorrectionType;

    constructor(public dialog: MdDialog) {
    }
}
