import {Moment} from 'moment';

import {VectorLayer, AbstractVectorSymbology} from 'wave-core';

import {CsvColumn} from './csv.model';

export type BasketResult = IBasketAbcdResult | IBasketPangaeaResult;

export type BasketType = BasketTypeAbcd | BasketTypePangaea | BasketTypeAbcdGrouped;
export type BasketTypeAbcd = 'abcd';
export type BasketTypeAbcdGrouped = 'abcd_grouped';
export type BasketTypePangaea = 'pangaea';

export interface IBasketResult {
    authors: Array<string>;
    available: boolean;
    dataCenter: string;
    dataLink: string;
    metadataLink: string;
    title: string;
    type: BasketType;
    resultType: string;
}

export interface IBasketAbcdResult extends IBasketResult {
    unitId?: string;
}

export interface IBasketGroupedAbcdUnits {
    unitId: string;
    prefix: string;
    type: string;
    metadataLink: string;
}

export interface IBasketGroupedAbcdResult extends IBasketResult {
    units: Array<IBasketGroupedAbcdUnits>;
}

export interface IBasketPangaeaResult extends IBasketResult {
    doi: string;
    format: string;
    isGeoReferenced?: boolean;
    isTabSeparated?: boolean;
    parameters: Array<CsvColumn>;
    geometrySpecification: string;
    column_x?: string;
    column_y?: string;
}

export interface Basket {
    query: string;
    results: Array<BasketResult>;
    timestamp: Moment;
}

export interface BasketsOverviewBasket {
    basketId: number;
    query: string;
    timestamp: Moment;
}

export interface BasketsOverview {
    baskets: Array<BasketsOverviewBasket>;
    totalNumberOfBaskets: number;
}

export interface BasketAvailability {
    availableLayers: Array<VectorLayer<AbstractVectorSymbology>>;
    nonAvailableNames: Array<string>;
}
