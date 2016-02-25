import Config from './config';

/**
 * The result type of a mapping operator.
 */
export enum ResultType {
    RASTER = 1,
    POINTS = 2,
    LINES = 3,
    POLYGONS = 4,
    PLOT = 4242 // this result type must not be used as an input.
}

type OperatorId = number;
type Projection = string; // TODO

/**
 * An operator represents a query graph consisting of source operators.
 * It has several metadata fields for e.g. parameters and projection.
 */
export class Operator {
    private _id: OperatorId;
    
    /**
     * The user-given name of this operator instance.
     */
    public name: string;
    
    private _resultType: ResultType;
    private operatorType: string;
    
    private parameters: Map<string, string | number>;
    private _projection: Projection;
    
    private symbology: any; // TODO
    
    private rasterSources: Operator[];
    private pointSources: Operator[];
    private lineSources: Operator[];
    private polygonSources: Operator[];
    
    private static _operatorId = 1;
    
    /**
     * Instantiate an operator.
     * 
     * @param operatorType      The mapping type name of the operator.
     * @param resultType        A {@link resultType}.
     * @param parameters        Operator-specific parameters.
     * @param projection        A {@link Projection}.
     * @param displayName       The user-given name of this operator instance.
     * @param rasterSources     A list of operators with {@link resultType} `RASTER`. 
     * @param pointSources      A list of operators with {@link resultType} `POINTS`. 
     * @param lineSources       A list of operators with {@link resultType} `LINES`. 
     * @param polygonSources    A list of operators with {@link resultType} `POLYGONS`. 
     * 
     */
    constructor(operatorType: string, resultType: ResultType, 
                parameters: Map<string, string | number>, projection: Projection,
                displayName: string, 
                rasterSources: Operator[] = [], pointSources: Operator[] = [],
                lineSources: Operator[] = [], polygonSources: Operator[] = []) {
        this._id = Operator.nextOperatorId;
        this.name = name;
        
        this.operatorType = operatorType,
        this._resultType = resultType;
        this.parameters = parameters;
        this._projection = projection;
        
        let sources: Array<[Operator[], Operator[], ResultType]> = [
            [rasterSources, this.rasterSources, ResultType.RASTER],
            [pointSources, this.pointSources, ResultType.POINTS],
            [lineSources, this.lineSources, ResultType.LINES],
            [polygonSources, this.polygonSources, ResultType.POLYGONS]
        ];
        
        for(let [source, sink, sinkType] of sources) {
            for(let operator of source) {
                if(operator.resultType == sinkType) {
                    sink.push(operator);
                } else {
                    throw Error('The Operator in array rasterSources is not of type RASTER.');
                }
            }
        }
        
    }
    
    private static get nextOperatorId(): OperatorId {
        return this._operatorId++;
    }
    
    /**
     * Unique id of this operator instance.
     */
    get id(): OperatorId {
        return this._id;
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
     * The total amount of sources.
     */
    get sourceCount(): number {
        return this.rasterSources.length + this.pointSources.length
                + this.lineSources.length + this.polygonSources.length;
    }
    
    /**
     * Retrieve a source by id.
     * 
     * @param id The id of the source operator.
     */
    getAnySource(id: number) {
        for(let source of this.rasterSources) {
            if(source.id == id) {
                return source;
            }
        }
        
        throw Error(`getAnySource: no source found with id ${id} in ${JSON.stringify(this)}`);
    }
    
    /**
     * Does the operator has sources or it it a **source operator**?
     */
    hasSources(): boolean {
        return this.rasterSources.length > 0 || this.pointSources.length > 0 
               || this.lineSources.length > 0 || this.polygonSources.length > 0;
    }
    
    /**
     * Retrieve the sources by type.
     * 
     * @param sourceType The {@link resultType} of the source.
     */
    getSources(sourceType: ResultType): Operator[] {
        switch(sourceType) {
            case ResultType.RASTER:
                return this.rasterSources;
            case ResultType.POINTS:
                return this.pointSources;
            case ResultType.LINES:
                return this.lineSources;
            case ResultType.POLYGONS:
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
        if (projection == this.projection) {
            return this;
        } else {
            let parameters = new Map<string, string | number>();
            parameters.set('src_projection', this.projection);
            parameters.set('dest_projection', projection);
            
            return new Operator(
                'projection',
                this.resultType,
                parameters,
                projection,
                `Projection of #${this.id}`,
                this.resultType == ResultType.RASTER ? [this] : [],
                this.resultType == ResultType.POINTS ? [this] : [],
                this.resultType == ResultType.LINES ? [this] : [],
                this.resultType == ResultType.POLYGONS ? [this] : []
            );
        }
    }
    
    /**
     * Dictionary reprensentation of the operator.
     */
    private toDict(): any {
        let dict: any = {
            'type': this.operatorType
        };
        
        if(this.parameters.size > 0) {
            let params: {[id:string]: any} = {};
            this.parameters.forEach((key, value, map) => {
                params[key] = value;
            });
            dict['params'] = params;
        }
        
        if(this.hasSources()) {
            let sources: any = {};
            
            let sourcesList: Array<[string, Operator[]]> = [
                [ResultType[ResultType.RASTER], this.rasterSources],
                [ResultType[ResultType.POINTS], this.pointSources],
                [ResultType[ResultType.LINES], this.lineSources],
                [ResultType[ResultType.POLYGONS], this.polygonSources]
            ];
            for(let [sourceString, source] of sourcesList) {
                if(source.length > 0) {
                    sources[sourceString] = [];
                    for(let operator of source) {
                        sources[sourceString].push(operator.toDict());
                    }
                }
            }
            
            dict['sources'] = sources;
        }
        
        return dict;
    }
    
    /**
     * String representation of the operator in JSON format.
     */
    toJSON(): string {
        return JSON.stringify(this.toDict());
    }
    
}
