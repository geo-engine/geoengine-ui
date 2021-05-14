import {DatasetDict, InternalDatasetIdDict, DatasetResultDescriptorDict, UUID, WorkflowDict, SrsString} from '../backend/backend.model';
import {
    RasterDataType,
    RasterDataTypes,
    VectorColumnDataType,
    VectorColumnDataTypes,
    VectorDataType,
    VectorDataTypes,
} from '../operators/datatype.model';

export class Dataset {
    readonly id: InternalDatasetId; // TODO: support all Id types
    readonly name: string;
    readonly description: string;
    readonly resultDescriptor: ResultDescriptor;
    readonly sourceOperator: string;

    constructor(config: DatasetDict) {
        this.id = InternalDatasetId.fromDict(config.id);
        this.name = config.name;
        this.description = config.description;
        this.resultDescriptor = ResultDescriptor.fromDict(config.resultDescriptor);
        this.sourceOperator = config.sourceOperator;
    }

    static fromDict(dict: DatasetDict): Dataset {
        return new Dataset(dict);
    }

    createSourceWorkflow(): WorkflowDict {
        return {
            type: this.resultDescriptor.getTypeString(),
            operator: {
                type: this.sourceOperator,
                params: {
                    dataset: this.id.toDict(),
                },
            },
        };
    }
}

export class InternalDatasetId {
    Internal: UUID;

    constructor(config: InternalDatasetIdDict) {
        this.Internal = config.internal;
    }

    static fromDict(config: InternalDatasetIdDict): InternalDatasetId {
        return new InternalDatasetId(config);
    }

    toDict(): InternalDatasetIdDict {
        return {
            internal: this.Internal,
        };
    }
}

export abstract class ResultDescriptor {
    readonly spatialReference: SrsString;

    protected constructor(spatialReference: SrsString) {
        this.spatialReference = spatialReference;
    }

    static fromDict(dict: DatasetResultDescriptorDict): ResultDescriptor {
        if ('vector' in dict) {
            return VectorResultDescriptor.fromDict(dict);
        } else if ('raster' in dict) {
            return RasterResultDescriptor.fromDict(dict);
        }

        throw Error('invalid result descriptor type');
    }

    abstract getTypeString(): 'Vector' | 'Raster';
}

export class RasterResultDescriptor extends ResultDescriptor {
    readonly dataType: RasterDataType;

    constructor(config: DatasetResultDescriptorDict) {
        if (!config.raster) {
            throw new Error('missing `RasterResultDescriptorDict`');
        }

        super(config.raster.spatialReference);
        this.dataType = RasterDataTypes.fromCode(config.raster.dataType);
    }

    static fromDict(dict: DatasetResultDescriptorDict): ResultDescriptor {
        return new RasterResultDescriptor(dict);
    }

    getTypeString(): 'Vector' | 'Raster' {
        return 'Raster';
    }
}

export class VectorResultDescriptor extends ResultDescriptor {
    readonly dataType: VectorDataType;
    readonly columns: Map<string, VectorColumnDataType>;

    constructor(config: DatasetResultDescriptorDict) {
        if (!config.vector) {
            throw new Error('missing `VectorResultDescriptorDict`');
        }

        super(config.vector.spatialReference);
        this.dataType = VectorDataTypes.fromCode(config.vector.dataType);
        this.columns = new Map(Object.entries(config.vector.columns).map(([key, value]) => [key, VectorColumnDataTypes.fromCode(value)]));
    }

    static fromDict(dict: DatasetResultDescriptorDict): ResultDescriptor {
        return new VectorResultDescriptor(dict);
    }

    getTypeString(): 'Vector' | 'Raster' {
        return 'Vector';
    }
}
