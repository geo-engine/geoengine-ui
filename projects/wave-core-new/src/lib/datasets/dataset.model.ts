import {
    DatasetDict,
    DatasetResultDescriptorDict,
    UUID,
    WorkflowDict,
    SrsString,
    ExternalDatasetIdDict,
    DatasetIdDict,
} from '../backend/backend.model';
import {
    RasterDataType,
    RasterDataTypes,
    VectorColumnDataType,
    VectorColumnDataTypes,
    VectorDataType,
    VectorDataTypes,
} from '../operators/datatype.model';

export class Dataset {
    readonly id: DatasetId;
    readonly name: string;
    readonly description: string;
    readonly resultDescriptor: ResultDescriptor;
    readonly sourceOperator: string;

    constructor(config: DatasetDict) {
        this.id = DatasetId.fromDict(config.id);
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

export abstract class DatasetId {
    static fromDict(dict: DatasetIdDict): DatasetId {
        if (dict.internal) {
            return InternalDatasetId.fromDict(dict.internal);
        } else if (dict.external) {
            return ExternalDatasetId.fromDict(dict.external);
        }

        throw Error('Unknown DatasetId type');
    }

    abstract toDict(): DatasetIdDict;
}

export class InternalDatasetId {
    id: UUID;

    constructor(id: UUID) {
        this.id = id;
    }

    static fromDict(config: UUID): InternalDatasetId {
        return new InternalDatasetId(config);
    }

    toDict(): DatasetIdDict {
        return {
            internal: this.id,
        };
    }
}

export class ExternalDatasetId {
    provider: UUID;
    id: string;

    constructor(config: ExternalDatasetIdDict) {
        this.provider = config.provider;
        this.id = config.id;
    }

    static fromDict(config: ExternalDatasetIdDict): ExternalDatasetId {
        return new ExternalDatasetId(config);
    }

    toDict(): DatasetIdDict {
        return {
            external: {
                provider: this.provider,
                id: this.id,
            },
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
