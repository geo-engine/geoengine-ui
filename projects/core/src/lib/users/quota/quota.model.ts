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

    get total(): number {
        const clamp_avail = this.available > 0 ? this.available : 0;
        return clamp_avail + this.used;
    }

    get fractionUsed(): number {
        if (this.total === 0) {
            return 1;
        }
        return Math.round(this.used / this.total);
    }

    get percentUsed(): number {
        return this.fractionUsed * 100;
    }

    static fromDict(dict: QuotaDict): Quota {
        return new Quota(dict.used, dict.available);
    }
}
