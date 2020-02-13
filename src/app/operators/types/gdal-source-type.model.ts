import {OperatorType, OperatorTypeDict, OperatorTypeMappingDict} from '../operator-type.model';
import {MappingRasterMethodology} from '../dialogs/data-repository/mapping-source.model';

interface GdalSourceTypeConfig {
    channel?: number; // required for old configs
    channelConfig: GdalSourceChannelOptions;
    sourcename: string;
    transform: boolean;
}

export interface GdalSourceChannelOptions {
    displayValue: string;
    channelNumber: number;
    methodology?: MappingRasterMethodology;
}

export interface GdalSourceTypeCloneOptions {
    channelConfig: GdalSourceChannelOptions;
}

interface GdalSourceTypeMappingDict extends OperatorTypeMappingDict {
    channel: number;
    sourcename: string;
    transform: boolean;
}

export interface GdalSourceTypeDict extends OperatorTypeDict {
    channelConfig: GdalSourceChannelOptions;
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

    private channelConfig: GdalSourceChannelOptions;
    private sourcename: string;
    private transform: boolean;

    static fromDict(dict: GdalSourceTypeDict): GdalSourceType {
        return new GdalSourceType(dict);
    }

    constructor(config: GdalSourceTypeConfig) {
        super();
        this.channelConfig = (config.channelConfig) ?
            config.channelConfig : {displayValue: 'channel number ' + config.channel, channelNumber: config.channel}; // convert old configs
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
            ['channelConfig', this.channelConfig.displayValue.toString()],
            ['sourcename', this.sourcename.toString()],
            ['transform', this.transform.toString()],
        ];
    }

    getParameterValue(parameterName: string): GdalSourceChannelOptions | undefined {
        switch (parameterName) {
            case 'channelConfig':
                return this.channelConfig;
            default:
                return undefined;
        }
    }

    toMappingDict(): GdalSourceTypeMappingDict {
        return {
            sourcename: this.sourcename,
            channel: this.channelConfig.channelNumber,
            transform: this.transform,
        };
    }

    toDict(): GdalSourceTypeDict {
        return {
            operatorType: GdalSourceType.TYPE,
            sourcename: this.sourcename,
            channelConfig: this.channelConfig,
            transform: this.transform,
        };
    }

    cloneWithModifications(options?: GdalSourceTypeCloneOptions): OperatorType {
        return new GdalSourceType({
            channelConfig: options && options.channelConfig ? options.channelConfig : this.channelConfig,
            sourcename: this.sourcename,
            transform: this.transform,
        });
    }

}
