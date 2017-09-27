import {ChangeDetectionStrategy, Component} from '@angular/core';
import {CsvColumns, CsvParameters} from '../csv.model';
import {IBasketPangaeaResult} from '../gfbio-basket.model';
import {BasketResult} from '../gfbio-basket-result.component';
import {RandomColorService} from '../../../../util/services/random-color.service';
import {UserService} from '../../../../users/user.service';
import {Projections} from '../../../projection.model';
import {MappingQueryService} from '../../../../queries/mapping-query.service';
import {LayerService} from '../../../../layers/layer.service';
import {ProjectService} from '../../../../project/project.service';
import {DataType, DataTypes} from '../../../datatype.model';
import {Unit} from '../../../unit.model';
import {ResultTypes} from '../../../result-type.model';
import {Operator} from '../../../operator.model';
import {PangaeaSourceType} from '../../../types/pangaea-source-type.model';

@Component({
    selector: 'wave-pangaea-basket-result',
    templateUrl: './pangaea-basket-result.component.html',
    styleUrls: ['./pangaea-basket-result.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PangaeaBasketResultComponent extends BasketResult<IBasketPangaeaResult> {

    constructor(mappingQueryService: MappingQueryService,
                layerService: LayerService,
                randomColorService: RandomColorService,
                userService: UserService,
                projectService: ProjectService) {
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

        csvColumns.x = this.result.column_x;
        csvColumns.y = this.result.column_y;

        const csvParameters: CsvParameters = {
            geometry: this.result.geometrySpecification,
            separator: '\t',
            time: 'none',
            columns: csvColumns,
            on_error: 'keep', // TODO: let the user decide on this
        };


        return new Operator({
            operatorType: new PangaeaSourceType({
                doi: this.result.doi,
                csvParameters: csvParameters,
            }),
            resultType: ResultTypes.fromCode(this.result.resultType),
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
