import {DatasetDict, InternalDatasetIdDict, DatasetResultDescriptorDict, UUID, WorkflowDict} from '../backend/backend.model';
import {SpatialReference, SpatialReferences} from '../operators/spatial-reference.model';
import {RasterDataType, RasterDataTypes, VectorDataType, VectorDataTypes} from '../operators/datatype.model';

export class Dataset {
    readonly id: InternalDatasetId; // TODO: support all Id types
    readonly name: string;
    readonly description: string;
    readonly result_descriptor: ResultDescriptor;
    readonly source_operator: string;

    constructor(config: DatasetDict) {
        this.id = InternalDatasetId.fromDict(config.id);
        this.name = config.name;
        this.description = config.description;
        this.result_descriptor = ResultDescriptor.fromDict(config.result_descriptor);
        this.source_operator = config.source_operator;
    }

    static fromDict(dict: DatasetDict): Dataset {
        return new Dataset(dict);
    }

    createSourceWorkflow(): WorkflowDict {
        return {
            type: this.result_descriptor.getTypeString(),
            operator: {
                type: this.source_operator,
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
        this.Internal = config.Internal;
    }

    static fromDict(config: InternalDatasetIdDict): InternalDatasetId {
        return new InternalDatasetId(config);
    }

    toDict(): InternalDatasetIdDict {
        return {
            Internal: this.Internal,
        };
    }
}

export abstract class ResultDescriptor {
    readonly spatial_reference: SpatialReference;

    protected constructor(spatialReference: SpatialReference) {
        this.spatial_reference = spatialReference;
    }

    static fromDict(dict: DatasetResultDescriptorDict): ResultDescriptor {
        if ('Vector' in dict) {
            return VectorResultDescriptor.fromDict(dict);
        } else {
            return RasterResultDescriptor.fromDict(dict);
        }
    }

    abstract getTypeString(): 'Vector' | 'Raster';
}

export class RasterResultDescriptor extends ResultDescriptor {
    readonly data_type: RasterDataType;

    constructor(config: DatasetResultDescriptorDict) {
        super(SpatialReferences.fromCode(config.Raster.spatial_reference));
        this.data_type = RasterDataTypes.fromCode(config.Raster.data_type);
    }

    static fromDict(dict: DatasetResultDescriptorDict): ResultDescriptor {
        return new RasterResultDescriptor(dict);
    }

    getTypeString(): 'Vector' | 'Raster' {
        return 'Raster';
    }
}

export class VectorResultDescriptor extends ResultDescriptor {
    readonly data_type: VectorDataType;
    readonly columns: Map<string, FeatureDataType>;

    constructor(config: DatasetResultDescriptorDict) {
        super(SpatialReferences.fromCode(config.Vector.spatial_reference));
        this.data_type = VectorDataTypes.fromCode(config.Vector.data_type);
        this.columns = new Map(Object.entries(config.Vector.columns).map(([key, value]) => [key, FeatureDataType[value]]));
    }

    static fromDict(dict: DatasetResultDescriptorDict): ResultDescriptor {
        return new VectorResultDescriptor(dict);
    }

    getTypeString(): 'Vector' | 'Raster' {
        return 'Vector';
    }
}

export enum FeatureDataType {
    Categorical = 'Categorical',
    Decimal = 'Decimal',
    Number = 'Number',
    Text = 'Text',
}
