import {AttributeFilterDict, DataIdDict, Layer, TypedResultDescriptorDict} from '@geoengine/core';

export interface BasketEntry {
    title: string;
    status: 'ok' | 'unavailable' | 'error';
    message: string | null;
    datasetId: DataIdDict;
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

export interface BasketResult {
    basket: Basket;
    layers: Array<Layer>;
}
