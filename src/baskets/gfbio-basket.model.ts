export type BasketResult = IBasketAbcdResult | IBasketPangaeaResult;

export type UnitGroupedBasketResult = IBasketGroupedAbcdResult | IBasketPangaeaResult;

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
}

export interface IBasket {
    query: string;
    results: Array<BasketResult>;
    timestamp: string;
}
