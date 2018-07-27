
import {Observable, Subscription, of as observableOf} from 'rxjs';
import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {BasicColumns, CsvColumn} from '../csv.model';
import {IBasketGroupedAbcdResult, IBasketGroupedAbcdUnits} from '../gfbio-basket.model';
import {BasketResult} from '../gfbio-basket-result.component';
import {RandomColorService} from '../../../../util/services/random-color.service';
import {UserService} from '../../../../users/user.service';
import {ABCDSourceType, ABCDSourceTypeConfig} from '../../../types/abcd-source-type.model';
import {Projections} from '../../../projection.model';
import {MappingQueryService} from '../../../../queries/mapping-query.service';
import {LayerService} from '../../../../layers/layer.service';
import {ProjectService} from '../../../../project/project.service';
import {DataType, DataTypes} from '../../../datatype.model';
import {Unit} from '../../../unit.model';
import {ResultTypes} from '../../../result-type.model';
import {Operator} from '../../../operator.model';
import {DataSource} from '@angular/cdk/collections';

class UnitDataSource extends DataSource<IBasketGroupedAbcdUnits> {
    private units: Array<IBasketGroupedAbcdUnits>;

    constructor(units: Array<IBasketGroupedAbcdUnits>) {
        super();
        this.units = units;
    }

    connect(): Observable<Array<IBasketGroupedAbcdUnits>> {
        return observableOf(this.units);
    }

    disconnect() {
    }
}

@Component({
    selector: 'wave-grouped-abcd-basket-result',
    templateUrl: './grouped-abcd-basket-result.component.html',
    styleUrls: ['./grouped-abcd-basket-result.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedAbcdBasketResultComponent extends BasketResult<IBasketGroupedAbcdResult> implements OnInit, OnDestroy {
    hasUnits = false;
    sourceSchema: Array<CsvColumn> = [];

    unitDataSource: UnitDataSource;
    displayedUnitColumns = ['prefix', 'type', 'unitId'];

    private abcdSchemaSubscription: Subscription;

    static createOperatorFromGroupedABCDData(result: IBasketGroupedAbcdResult,
                                             sourceSchema: Array<CsvColumn>,
                                             filterUnits: boolean): Operator {
        const basicColumns: BasicColumns = {
            numeric: [],
            textual: [],
        };

        const attributes: Array<string> = [];
        const dataTypes = new Map<string, DataType>();
        const units = new Map<string, Unit>();

        for (let attribute of sourceSchema) {

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
            provider: result.dataCenter,
            id: result.dataLink,
            columns: basicColumns,
        };

        if (filterUnits) {
            sourceTypeConfig.units = result.units.map((u) => u.unitId);
        }

        return new Operator({
            operatorType: new ABCDSourceType(sourceTypeConfig),
            resultType: ResultTypes.POINTS,
            projection: Projections.WGS_84,
            attributes: attributes,
            dataTypes: dataTypes,
            units: units,
        });
    }

    constructor(protected mappingQueryService: MappingQueryService,
                protected layerService: LayerService,
                protected randomColorService: RandomColorService,
                protected userService: UserService,
                protected projectService: ProjectService) {
        super(mappingQueryService, layerService, randomColorService, userService, projectService);
    };

    ngOnInit() {
        this.hasUnits = this.result.units.length > 0;
        this.abcdSchemaSubscription = this.userService.getSourceSchemaAbcd().subscribe(schema => {
            // TODO: subscribe when something might change...
            this.sourceSchema = schema;
        });

        this.unitDataSource = new UnitDataSource(this.result.units);
    }

    ngOnDestroy() {
        this.abcdSchemaSubscription.unsubscribe();
    }

    add(filterUnits: boolean) {
        this.createAndAddLayer(
            GroupedAbcdBasketResultComponent.createOperatorFromGroupedABCDData(this.result, this.sourceSchema, filterUnits),
            this.result.title
        );
    }

}
