import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

import {ResultType, ResultTypes} from '../result-type.model';

interface WKTSourceTypeMappingDict extends OperatorTypeMappingDict {
    type: string;
    wkt: string;
}

export interface WKTSourceTypeDict extends OperatorTypeDict {
    type: string;
    wkt: string;
}

interface WKTSourceTypeConfig {
    type: ResultType;
    wkt: string;
}

/**
 * The WKT Source type.
 */
export class WKTSourceType extends OperatorType {
    private static _TYPE = 'wkt_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(WKTSourceType._TYPE);
    private static _NAME = 'WKT Source';

    static get TYPE(): string { return WKTSourceType._TYPE; }
    static get ICON_URL(): string { return WKTSourceType._ICON_URL; }
    static get NAME(): string { return WKTSourceType._NAME; }

    private type: ResultType;
    private wkt: string;

    constructor(config: WKTSourceTypeConfig) {
        super();
        this.type = config.type;
        this.wkt = config.wkt;
    }

    static fromDict(dict: WKTSourceTypeDict): WKTSourceType {
        return new WKTSourceType({
            type:  ResultTypes.fromCode(dict.type),
            wkt: dict.wkt,
        });
    }

    getMappingName(): string {
        return WKTSourceType.TYPE;
    }

    getIconUrl(): string {
        return WKTSourceType.ICON_URL;
    }

    toString(): string {
        return WKTSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['type', this.type.toString()],
            ['wkt', this.wkt.toString()],
        ];
    }

    toMappingDict(): WKTSourceTypeMappingDict {
        return {
            type: this.type.getCode(),
            wkt: this.wkt,
        };
    }

    toDict(): WKTSourceTypeDict {
        return {
            operatorType: WKTSourceType.TYPE,
            type: this.type.getCode(),
            wkt: this.wkt,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return WKTSourceType.fromDict(this.toDict()); // TODO: add modifications
    }
}
