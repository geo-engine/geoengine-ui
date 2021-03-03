import {ChangeDetectionStrategy, Component, Inject} from '@angular/core';

import {
    RandomColorService,
    UserService,
    Projections,
    MappingQueryService,
    LayerService,
    ProjectService,
    DataType,
    DataTypes,
    Unit,
    ResultTypes,
    Operator,
} from 'wave-core';

import {CsvColumns, CsvParameters} from '../csv.model';
import {IBasketPangaeaResult} from '../gfbio-basket.model';
import {BasketResultComponent} from '../gfbio-basket-result.component';
import {PangaeaSourceType} from '../../../types/pangaea-source-type.model';
import {GFBioMappingQueryService} from '../../../../queries/mapping-query.service';
import {GFBioUserService} from '../../../../users/user.service';

@Component({
    selector: 'wave-gfbio-pangaea-basket-result',
    templateUrl: './pangaea-basket-result.component.html',
    styleUrls: ['./pangaea-basket-result.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PangaeaBasketResultComponent extends BasketResultComponent<IBasketPangaeaResult> {
    static createOperatorFromPangaeaData(result: IBasketPangaeaResult): Operator {
        const csvColumns: CsvColumns = {
            numeric: [],
            textual: [],
            x: '',
            y: '',
        };

        const attributes: Array<string> = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        for (const attribute of result.parameters) {
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

        csvColumns.x = result.column_x;
        csvColumns.y = result.column_y;

        const csvParameters: CsvParameters = {
            geometry: result.geometrySpecification,
            separator: '\t',
            time: 'none',
            columns: csvColumns,
            on_error: 'keep', // TODO: let the user decide on this
        };

        return new Operator({
            operatorType: new PangaeaSourceType({
                doi: result.doi,
                csvParameters,
            }),
            resultType: ResultTypes.fromCode(result.resultType),
            projection: Projections.WGS_84,
            attributes,
            dataTypes,
            units,
        });
    }

    constructor(
        @Inject(MappingQueryService) protected readonly mappingQueryService: GFBioMappingQueryService,
        protected readonly layerService: LayerService,
        protected readonly randomColorService: RandomColorService,
        @Inject(UserService) protected readonly userService: GFBioUserService,
        protected readonly projectService: ProjectService,
    ) {
        super(mappingQueryService, layerService, randomColorService, userService, projectService);
    }

    createResultOperator(): Operator {
        return PangaeaBasketResultComponent.createOperatorFromPangaeaData(this.result);
    }

    addDataset() {
        this.createAndAddLayer(this.createResultOperator(), this.result.title);
    }
}
