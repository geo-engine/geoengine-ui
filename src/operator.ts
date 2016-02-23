import Config from './config';

export enum ResultType {
    RASTER = 1,
    POINTS = 2,
    LINES = 3,
    POLYGONS = 4,
    PLOT = 4242
}

type OperatorId = number;
type Projection = string; // TODO

export class Operator {
    private _id: OperatorId;
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
    
    get id(): OperatorId {
        return this._id;
    }
    
    get resultType(): ResultType {
        return this._resultType;
    }
    
    get projection(): Projection {
        return this._projection;
    }
    
    get sourceCount(): number {
        return this.rasterSources.length + this.pointSources.length
                + this.lineSources.length + this.polygonSources.length;
    }
    
    getAnySource(id: number) {
        for(let source of this.rasterSources) {
            if(source.id == id) {
                return source;
            }
        }
        
        throw Error(`getAnySource: no source found with id ${id} in ${JSON.stringify(this)}`);
    }
    
    hasSources(): boolean {
        return this.rasterSources.length > 0 || this.pointSources.length > 0 
               || this.lineSources.length > 0 || this.polygonSources.length > 0;
    }
    
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
    
    getProjectedOperator(projection: Projection): Operator {
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
    
    toJSON(): string {
        return JSON.stringify(this.toDict());
    }
    
}
