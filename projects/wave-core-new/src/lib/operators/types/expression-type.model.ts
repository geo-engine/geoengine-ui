import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

import {Unit, UnitDict, UnitMappingDict} from '../unit.model';
import {DataType, DataTypes} from '../datatype.model';

/**
 * The expression specifies calculations between the rasters.
 * There must be a valid data type and unit for the resulting raster.
 */
interface ExpressionTypeConfig {
    expression: string;
    datatype: DataType;
    unit: Unit;
}

interface ExpressionTypeMappingDict extends OperatorTypeMappingDict {
    expression: string;
    datatype: string;
    unit: UnitMappingDict;
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
    private datatype: DataType;
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
            datatype: DataTypes.fromCode(dict.datatype),
            unit: Unit.fromDict(dict.unit),
        });
    }

    getMappingName(): string {
        return ExpressionType.TYPE;
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

    toMappingDict(): ExpressionTypeMappingDict {
        return {
            expression: this.expression,
            datatype: this.datatype.getCode(),
            unit: this.unit.toMappingDict(),
        };
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
