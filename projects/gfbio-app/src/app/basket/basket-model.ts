import {AttributeFilterDict, DatasetIdDict, TypedResultDescriptorDict} from 'wave-core';

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
