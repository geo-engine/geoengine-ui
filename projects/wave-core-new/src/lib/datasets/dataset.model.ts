import {
    DatasetDict,
    TypedResultDescriptorDict,
    UUID,
    WorkflowDict,
    SrsString,
    DatasetIdDict,
    ExternalDatasetIdDict,
    RasterResultDescriptorDict,
    VectorResultDescriptorDict,
    SourceOperatorDict,
} from '../backend/backend.model';
import {Measurement} from '../layers/measurement';
import {Symbology} from '../layers/symbology/symbology.model';
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
    readonly symbology?: Symbology;

    constructor(config: DatasetDict) {
        this.id = DatasetId.fromDict(config.id);
        this.name = config.name;
        this.description = config.description;
        this.resultDescriptor = ResultDescriptor.fromDict(config.resultDescriptor);
        this.sourceOperator = config.sourceOperator;
        this.symbology = config.symbology ? Symbology.fromDict(config.symbology) : undefined;
    }

    static fromDict(dict: DatasetDict): Dataset {
        return new Dataset(dict);
    }

    createSourceWorkflow(): WorkflowDict {
        return this.createSourceWorkflowWithOperator({
            type: this.sourceOperator,
            params: {
                dataset: this.id.toDict(),
            },
        });
    }

    createSourceWorkflowWithOperator(operator: SourceOperatorDict): WorkflowDict {
        return {
            type: this.resultDescriptor.getTypeString(),
            operator,
        };
    }
}

export abstract class DatasetId {
    static fromDict(dict: DatasetIdDict): DatasetId {
        if (dict.type === 'internal') {
            return InternalDatasetId.fromDict(dict.datasetId);
        } else if (dict.type === 'external') {
            return ExternalDatasetId.fromDict(dict);
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
            type: 'internal',
            datasetId: this.id,
        };
    }
}

export class ExternalDatasetId {
    provider: UUID;
    dataset: string;

    constructor(config: ExternalDatasetIdDict) {
        this.provider = config.providerId;
        this.dataset = config.datasetId;
    }

    static fromDict(config: ExternalDatasetIdDict): ExternalDatasetId {
        return new ExternalDatasetId(config);
    }

    toDict(): DatasetIdDict {
        return {
            type: 'external',
            providerId: this.provider,
            datasetId: this.dataset,
        };
    }
}

export abstract class ResultDescriptor {
    readonly spatialReference: SrsString;

    protected constructor(spatialReference: SrsString) {
        this.spatialReference = spatialReference;
    }

    static fromDict(dict: TypedResultDescriptorDict): ResultDescriptor {
        if (dict.type === 'vector') {
            return VectorResultDescriptor.fromDict(dict);
        } else if (dict.type === 'raster') {
            return RasterResultDescriptor.fromDict(dict);
        }

        throw Error('invalid result descriptor type');
    }

    abstract getTypeString(): 'Vector' | 'Raster';
}

export class RasterResultDescriptor extends ResultDescriptor {
    readonly dataType: RasterDataType;

    constructor(config: RasterResultDescriptorDict) {
        super(config.spatialReference);
        this.dataType = RasterDataTypes.fromCode(config.dataType);
    }

    static fromDict(dict: RasterResultDescriptorDict): ResultDescriptor {
        return new RasterResultDescriptor(dict);
    }

    getTypeString(): 'Vector' | 'Raster' {
        return 'Raster';
    }
}

export class VectorResultDescriptor extends ResultDescriptor {
    readonly dataType: VectorDataType;
    readonly columns: Map<string, VectorColumnDataType>;
    readonly measurements: Map<string, Measurement>;

    constructor(config: VectorResultDescriptorDict) {
        super(config.spatialReference);
        this.dataType = VectorDataTypes.fromCode(config.dataType);
        this.columns = new Map(Object.entries(config.columns).map(([key, value]) => [key, VectorColumnDataTypes.fromCode(value.dataType)]));
        this.measurements = new Map(Object.entries(config.columns).map(([key, value]) => [key, Measurement.fromDict(value.measurement)]));
    }

    static fromDict(dict: VectorResultDescriptorDict): ResultDescriptor {
        return new VectorResultDescriptor(dict);
    }

    getTypeString(): 'Vector' | 'Raster' {
        return 'Vector';
    }
}
