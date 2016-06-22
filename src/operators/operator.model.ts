import Immutable from 'immutable';

import {ResultType, ResultTypes} from './result-type.model';
import {Projection, Projections} from './projection.model';
import {Unit, UnitDict} from './unit.model';
import {DataType, DataTypes} from './datatype.model';

import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from './operator-type.model';
import {OperatorTypeFactory} from './types/type-factory.service';
import {ProjectionType} from './types/projection-type.model';

type OperatorId = number;
type AttributeName = string;

/**
 * Interface for Operator constructor.
 */
export interface OperatorConfig {
    operatorType: OperatorType;
    resultType: ResultType;
    projection: Projection;
    attributes?: Immutable.List<AttributeName> | Array<AttributeName>;
    dataTypes?: Immutable.Map<AttributeName, DataType> | Map<AttributeName, DataType>;
    units?: Immutable.Map<AttributeName, Unit> | Map<AttributeName, Unit>;
    rasterSources?: Immutable.List<Operator> | Array<Operator>;
    pointSources?: Immutable.List<Operator> | Array<Operator>;
    lineSources?: Immutable.List<Operator> | Array<Operator>;
    polygonSources?: Immutable.List<Operator> | Array<Operator>;
}

/**
 * Serialization interface
 */
export interface OperatorDict {
    id: number;
    operatorType: OperatorTypeDict;
    resultType: string;
    projection: string;
    attributes: Array<string>;
    dataTypes: Array<[string, string]>;
    units: Array<[string, UnitDict]>;
    rasterSources: Array<OperatorDict>;
    pointSources: Array<OperatorDict>;
    lineSources: Array<OperatorDict>;
    polygonSources: Array<OperatorDict>;
}

/**
 * Serialization for mapping query.
 */
interface QueryDict {
    type: string;
    params: OperatorTypeMappingDict;
    sources?: {
        raster?: Array<QueryDict>;
        points?: Array<QueryDict>;
        lines?: Array<QueryDict>;
        polygons?: Array<QueryDict>;
    };
}

/**
 * An operator represents a query graph consisting of source operators.
 * It has several metadata fields for e.g. parameters and projection.
 */
export class Operator {
    private static _nextOperatorId = 1; // used for operator id generation

    private _id: OperatorId;

    private _resultType: ResultType;
    private _operatorType: OperatorType;

    private _attributes: Immutable.List<AttributeName>;
    private _dataTypes: Immutable.Map<AttributeName, DataType>;
    private _units: Immutable.Map<AttributeName, Unit>;

    private _projection: Projection;

    private rasterSources: Immutable.List<Operator>;
    private pointSources: Immutable.List<Operator>;
    private lineSources: Immutable.List<Operator>;
    private polygonSources: Immutable.List<Operator>;

    /**
     * Instantiate an operator.
     *
     * @param config.operatorType      The mapping type name of the operator.
     * @param config.resultType        A {@link resultType}.
     * @param config.projection        A {@link Projection}.
     * @param config.displayName       The user-given name of this operator instance.
     * @param config.rasterSources     A list of operators with {@link ResultType} `RASTER`.
     * @param config.pointSources      A list of operators with {@link ResultType} `POINTS`.
     * @param config.lineSources       A list of operators with {@link ResultType} `LINES`.
     * @param config.polygonSources    A list of operators with {@link ResultType} `POLYGONS`.
     *
     */
    constructor(config: OperatorConfig) {
        this._id = Operator.nextOperatorId;

        this._operatorType = config.operatorType;
        this._resultType = config.resultType;

        this._projection = config.projection;

        if (config.attributes) {
            this._attributes = config.attributes instanceof Immutable.List ?
                config.attributes as Immutable.List<AttributeName> :
                Immutable.List(config.attributes as Array<AttributeName>);
        } else {
            this._attributes = Immutable.List<AttributeName>();
        }

        if (config.dataTypes) {
            this._dataTypes = config.dataTypes instanceof Immutable.Map ?
                config.dataTypes as Immutable.Map<AttributeName, DataType> :
                Immutable.Map<AttributeName, DataType>(
                    (config.dataTypes as Map<AttributeName, DataType>).entries()
                );
        } else {
            this._dataTypes = Immutable.Map<AttributeName, DataType>();
        }

        if (config.units) {
            this._units = config.units instanceof Immutable.Map ?
                config.units as Immutable.Map<AttributeName, Unit> :
                Immutable.Map<AttributeName, Unit>(
                    (config.units as Map<AttributeName, Unit>).entries()
                );
        } else {
            this._units = Immutable.Map<AttributeName, Unit>();
        }

        const returnChecked = (source: Immutable.List<Operator> | Array<Operator>,
                               type: ResultType): Immutable.List<Operator> => {
            if (source) {
                const list = source instanceof Immutable.List ?
                    source as Immutable.List<Operator> : Immutable.List(source as Array<Operator>);

                if (list.filter(op => op.resultType !== type).size > 0) {
                    throw Error(`The Input Operator is not of type ${type.toString()}.`);
                } else {
                    return list;
                }
            } else {
                return Immutable.List<Operator>();
            }
        };

        this.rasterSources = returnChecked(config.rasterSources, ResultTypes.RASTER);
        this.pointSources = returnChecked(config.pointSources, ResultTypes.POINTS);
        this.lineSources = returnChecked(config.lineSources, ResultTypes.LINES);
        this.polygonSources = returnChecked(config.polygonSources, ResultTypes.POLYGONS);
    }

    static fromJSON(json: string): Operator {
      return this.fromDict(JSON.parse(json));
    }

    static fromDict(operatorDict: OperatorDict): Operator {
        const operator = new Operator({
            operatorType: OperatorTypeFactory.fromDict(operatorDict.operatorType),
            resultType: ResultTypes.fromCode(operatorDict.resultType),
            projection: Projections.fromCode(operatorDict.projection),
            attributes: Immutable.List(operatorDict.attributes),
            dataTypes: Immutable.Map<AttributeName, DataType>(
                (operatorDict.dataTypes as Array<[string, string]>).map(
                    ([name, dataTypeCode]) => [name, DataTypes.fromCode(dataTypeCode)]
                )
            ),
            units: Immutable.Map<AttributeName, Unit>(
                (operatorDict.units as Array<[string, UnitDict]>).map(
                    ([name, unitDict]) => [name, Unit.fromDict(unitDict)]
                )
            ),
            rasterSources: Immutable.List(operatorDict.rasterSources.map(Operator.fromDict)),
            pointSources: Immutable.List(operatorDict.pointSources.map(Operator.fromDict)),
            lineSources: Immutable.List(operatorDict.lineSources.map(Operator.fromDict)),
            polygonSources: Immutable.List(operatorDict.polygonSources.map(Operator.fromDict)),
        });

        Operator._nextOperatorId = Math.max(Operator._nextOperatorId, operatorDict.id + 1);
        operator._id = operatorDict.id;
        // TODO: check for operator id clashes.

        return operator;
    }

    /**
     * Retrieve a new unique id.
     * @return operator id
     */
    private static get nextOperatorId(): OperatorId {
        return this._nextOperatorId++;
    }

    /**
     * Unique id of this operator instance.
     */
    get id(): OperatorId {
        return this._id;
    }

    /**
     * The type of the operator.
     */
    get operatorType(): OperatorType {
        return this._operatorType;
    }

    /**
     * Retrieve the output result type.
     */
    get resultType(): ResultType {
        return this._resultType;
    }

    /**
     * Retrieve the output projection.
     */
    get projection(): Projection {
        return this._projection;
    }

    /**
     * Retrieve the output attributes.
     */
    get attributes(): Immutable.List<AttributeName> {
        return this._attributes;
    }

    /**
     * Retrieve the attribute data type.
     */
    getDataType(attribute: AttributeName): DataType {
        return this._dataTypes.get(attribute);
    }

    /**
     * Retrieve all data types.
     */
    get dataTypes(): Immutable.Map<AttributeName, DataType> {
        return this._dataTypes;
    }

    /**
     * Retrieve the attribute unit.
     */
    getUnit(attribute: AttributeName): Unit {
        return this._units.get(attribute);
    }

    /**
     * Retrieve all units.
     */
    get units(): Immutable.Map<AttributeName, Unit> {
        return this._units;
    }

    /**
     * The total amount of sources.
     */
    get sourceCount(): number {
        return this.rasterSources.size + this.pointSources.size
               + this.lineSources.size + this.polygonSources.size;
    }

    /**
     * Retrieve a source by id.
     *
     * @param id The id of the source operator.
     */
    getAnySource(id: number) {
        const predicate = (operator: Operator) => operator._id === id;

        for (const source of [this.rasterSources, this.pointSources,
                              this.lineSources, this.polygonSources]) {
            const result = source.find(predicate);

            if (result) {
                return result;
            }
        }

        throw Error(`getAnySource: no source found with id ${id} in ${JSON.stringify(this)}`);
    }

    /**
     * Does the operator has sources or it it a **source operator**?
     */
    hasSources(): boolean {
        return this.rasterSources.size > 0 || this.pointSources.size > 0
               || this.lineSources.size > 0 || this.polygonSources.size > 0;
    }

    /**
     * Retrieve the sources by type.
     *
     * @param sourceType The {@link resultType} of the source.
     */
    getSources(sourceType: ResultType): Immutable.List<Operator> {
        switch (sourceType) {
            case ResultTypes.RASTER:
                return this.rasterSources;
            case ResultTypes.POINTS:
                return this.pointSources;
            case ResultTypes.LINES:
                return this.lineSources;
            case ResultTypes.POLYGONS:
                return this.polygonSources;
            default:
                throw Error('Invalid Source Type');
        }
    }

    /**
     * Return the operator with an optional projection operator to
     * comply with the desired {@link Projection}.
     *
     * @param projection The desired output projection.
     */
    getProjectedOperator(projection: Projection): Operator {
        if (projection === this.projection) {
            return this;
        } else {
            return new Operator({
                operatorType: new ProjectionType({
                    srcProjection: this.projection,
                    destProjection: projection,
                }),
                resultType: this.resultType,
                projection: projection,
                attributes: this._attributes,
                dataTypes: this._dataTypes,
                units: this._units,
                rasterSources: this.resultType === ResultTypes.RASTER ?
                                Immutable.List.of(this) : Immutable.List<Operator>(),
                pointSources: this.resultType === ResultTypes.POINTS ?
                                Immutable.List.of(this) : Immutable.List<Operator>(),
                lineSources: this.resultType === ResultTypes.LINES ?
                                Immutable.List.of(this) : Immutable.List<Operator>(),
                polygonSources: this.resultType === ResultTypes.POLYGONS ?
                                Immutable.List.of(this) : Immutable.List<Operator>(),
            });
        }
    }

    /**
     * String representation of the operator as query parameter in JSON format.
     */
    toQueryJSON(): string {
        return JSON.stringify(this.toQueryDict());
    }

    toDict(): OperatorDict {
      const dict: OperatorDict = {
        id: this._id,
        resultType: this._resultType.getCode(),
        operatorType: this._operatorType.toDict(),
        projection: this._projection.getCode(),
        attributes: this._attributes.toArray(),
        dataTypes: this._dataTypes.map(
            (datatype, attribute) => [attribute, datatype.getCode()]
        ).toArray() as Array<[string, string]>,
        units: this._units.map(
            (unit, attribute) => [attribute, unit.toDict()]
        ).toArray() as Array<[string, UnitDict]>,
        rasterSources: this.rasterSources.map(operator => operator.toDict()).toArray(),
        pointSources: this.pointSources.map(operator => operator.toDict()).toArray(),
        lineSources: this.lineSources.map(operator => operator.toDict()).toArray(),
        polygonSources: this.polygonSources.map(operator => operator.toDict()).toArray(),
      };

      return dict;
    }

    toJSON(): string {
        return JSON.stringify(this.toDict());
    }

    /**
     * Dictionary reprensentation of the operator as query parameter.
     */
    private toQueryDict(): QueryDict {
        const dict: QueryDict = {
            type: this._operatorType.getMappingName(),
            params: this._operatorType.toMappingDict(),
        };

        if (this.hasSources()) {
            const sources = {};

            const sourcesList: Array<[string, Immutable.List<Operator>]> = [
                [ResultTypes.RASTER.getCode(), this.rasterSources],
                [ResultTypes.POINTS.getCode(), this.pointSources],
                [ResultTypes.LINES.getCode(), this.lineSources],
                [ResultTypes.POLYGONS.getCode(), this.polygonSources],
            ];
            for (const [sourceString, source] of sourcesList) {
                if (source.size > 0) {
                    sources[sourceString] = source.map(
                        (operator: Operator) => operator.toQueryDict()
                    ).toArray();
                }
            }

            dict['sources'] = sources;
        }

        return dict;
    }

}
