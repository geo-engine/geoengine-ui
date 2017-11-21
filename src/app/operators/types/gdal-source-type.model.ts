import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict}
  from '../operator-type.model';

interface GdalSourceTypeConfig {
    channel: number;
    sourcename: string;
    transform: boolean;
}

interface GdalSourceTypeMappingDict extends OperatorTypeMappingDict {
    channel: number;
    sourcename: string;
    transform: boolean;
}

export interface GdalSourceTypeDict extends OperatorTypeDict  {
    channel: number;
    sourcename: string;
    transform: boolean;
}

/**
 * The raster source type.
 */
export class GdalSourceType extends OperatorType {
    private static _TYPE = 'gdal_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(GdalSourceType._TYPE);
    private static _NAME = 'GDAL Source';

    static get TYPE(): string { return GdalSourceType._TYPE; }
    static get ICON_URL(): string { return GdalSourceType._ICON_URL; }
    static get NAME(): string { return GdalSourceType._NAME; }

    private channel: number;
    private sourcename: string;
    private transform: boolean;

    static fromDict(dict: GdalSourceTypeDict): GdalSourceType {
        return new GdalSourceType(dict);
    }

    constructor(config: GdalSourceTypeConfig) {
        super();
        this.channel = config.channel;
        this.sourcename = config.sourcename;
        this.transform = config.transform;
    }

    getMappingName(): string {
        return GdalSourceType.TYPE;
    }

    getIconUrl(): string {
        return GdalSourceType.ICON_URL;
    }

    toString(): string {
        return GdalSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['channel', this.channel.toString()],
            ['sourcename', this.sourcename.toString()],
            ['transform', this.transform.toString()],
        ];
    }

    toMappingDict(): GdalSourceTypeMappingDict {
        return {
            sourcename: this.sourcename,
            channel: this.channel,
            transform: this.transform,
        };
    }

    toDict(): GdalSourceTypeDict {
        return {
            operatorType: GdalSourceType.TYPE,
            sourcename: this.sourcename,
            channel: this.channel,
            transform: this.transform,
        };
    }

}
