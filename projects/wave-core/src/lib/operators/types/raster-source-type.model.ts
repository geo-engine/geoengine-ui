import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';

interface RasterSourceTypeConfig {
    channel: number;
    sourcename: string;
    transform: boolean;
}

interface RasterSourceTypeMappingDict extends OperatorTypeMappingDict {
    channel: number;
    sourcename: string;
    transform: boolean;
}

export interface RasterSourceTypeDict extends OperatorTypeDict {
    channel: number;
    sourcename: string;
    transform: boolean;
}

/**
 * The raster source type.
 */
export class RasterSourceType extends OperatorType {
    private static _TYPE = 'rasterdb_source';
    private static _ICON_URL = OperatorType.createIconDataUrl(RasterSourceType._TYPE);
    private static _NAME = 'Raster Source';

    static get TYPE(): string {
        return RasterSourceType._TYPE;
    }
    static get ICON_URL(): string {
        return RasterSourceType._ICON_URL;
    }
    static get NAME(): string {
        return RasterSourceType._NAME;
    }

    private channel: number;
    private sourcename: string;
    private transform: boolean;

    constructor(config: RasterSourceTypeConfig) {
        super();
        this.channel = config.channel;
        this.sourcename = config.sourcename;
        this.transform = config.transform;
    }

    static fromDict(dict: RasterSourceTypeDict): RasterSourceType {
        return new RasterSourceType(dict);
    }

    getMappingName(): string {
        return RasterSourceType.TYPE;
    }

    getIconUrl(): string {
        return RasterSourceType.ICON_URL;
    }

    toString(): string {
        return RasterSourceType.NAME;
    }

    getParametersAsStrings(): Array<[string, string]> {
        return [
            ['channel', this.channel.toString()],
            ['sourcename', this.sourcename.toString()],
            ['transform', this.transform.toString()],
        ];
    }

    toMappingDict(): RasterSourceTypeMappingDict {
        return {
            sourcename: this.sourcename,
            channel: this.channel,
            transform: this.transform,
        };
    }

    toDict(): RasterSourceTypeDict {
        return {
            operatorType: RasterSourceType.TYPE,
            sourcename: this.sourcename,
            channel: this.channel,
            transform: this.transform,
        };
    }

    cloneWithModifications(options?: {}): OperatorType {
        return RasterSourceType.fromDict(this.toDict()); // TODO: add modifications
    }
}
