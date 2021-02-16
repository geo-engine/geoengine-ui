import {OperatorType, OperatorTypeDict} from '../operator-type.model';

import {Unit, UnitDict} from '../unit.model';
import {RasterDataType, RasterDataTypes} from '../datatype.model';

/**
 * The expression specifies calculations between the rasters.
 * There must be a valid data type and unit for the resulting raster.
 */
interface ExpressionTypeConfig {
    expression: string;
    datatype: RasterDataType;
    unit: Unit;
}

export interface ExpressionTypeDict extends OperatorTypeDict {
    expression: string;
    datatype: string;
    unit: UnitDict;
}

/**
 * The expression type.
 */
export class ExpressionType extends OperatorType {
    private static _TYPE = 'expression';
    private static _ICON_URL = 'assets/operator-type-icons/expression.png';
    private static _NAME = 'Expression';

    static get TYPE(): string {
        return ExpressionType._TYPE;
    }

    static get ICON_URL(): string {
        return ExpressionType._ICON_URL;
    }

    static get NAME(): string {
        return ExpressionType._NAME;
    }

    private expression: string;
    private datatype: RasterDataType;
    private unit: Unit;

    constructor(config: ExpressionTypeConfig) {
        super();
        this.expression = config.expression;
        this.datatype = config.datatype;
        this.unit = config.unit;
    }

    static fromDict(dict: ExpressionTypeDict): ExpressionType {
        return new ExpressionType({
            expression: dict.expression,
            datatype: RasterDataTypes.fromCode(dict.datatype),
            unit: Unit.fromDict(dict.unit),
        });
    }

    getIconUrl(): string {
        return ExpressionType.ICON_URL;
    }

    toString(): string {
        return ExpressionType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['expression', this.expression.toString()],
            ['datatype', this.datatype.toString()],
            ['unit', this.unit.toString()],
        ];
    }

    toDict(): ExpressionTypeDict {
        return {
            operatorType: ExpressionType.TYPE,
            expression: this.expression,
            datatype: this.datatype.getCode(),
            unit: this.unit.toDict(),
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return ExpressionType.fromDict(this.toDict()); // TODO: add modifications
    }
}
