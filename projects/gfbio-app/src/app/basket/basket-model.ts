import {DatasetIdDict, TypedResultDescriptorDict} from 'wave-core';
import {AttributeFilterDict} from '../../../../wave-core-new/src/lib/backend/backend.model';

export interface BasketEntry {
    title: string;
    status: 'ok' | 'unavailable' | 'error';
    message: string | null;
    datasetId: DatasetIdDict;
    sourceOperator: string;
    resultDescriptor: TypedResultDescriptorDict;
    attributeFilters: Array<AttributeFilterDict> | undefined;
}

export interface Basket {
    basketId: number;
    content: Array<BasketEntry>;
    userId: string | null;
    created: Date;
    updated: Date;
}
