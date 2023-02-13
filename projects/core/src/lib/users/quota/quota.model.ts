import {QuotaDict} from '../../backend/backend.model';

export class Quota {
    protected _used: number;
    protected _available: number;

    constructor(used: number, available: number) {
        this._used = used;
        this._available = available;
    }

    get used(): number {
        return this._used;
    }

    get available(): number {
        return this._available;
    }

    static fromDict(dict: QuotaDict): Quota {
        return new Quota(dict.used, dict.available);
    }
}
