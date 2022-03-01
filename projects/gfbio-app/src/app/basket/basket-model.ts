import {DatasetIdDict, TypedResultDescriptorDict} from 'wave-core';

export interface BasketEntry {
    title: string,
    status: "ok" | "unavailable" | "error",
    message: String | null,
    datasetId: DatasetIdDict,
    sourceOperator: string,
    resultDescriptor: TypedResultDescriptorDict,
}


export interface Basket {
    basket_id: number;
    content: Array<BasketEntry>;
    user_id: String | null;
    created: Date;
    updated: Date;
}
