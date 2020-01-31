import {
    DictParameterArray,
    DictParameterArrayConfig,
    OperatorTypeParameterOptions,
    OperatorTypeParameterOptionsConfig,
    OptionsDict,
    ParameterName,
    ParameterOptionType
} from '../operator-type-parameter-options.model';

import {GdalSourceType} from '../types/gdal-source-type.model';

export interface GdalSourceParameterOptionsConfig extends OperatorTypeParameterOptionsConfig {
    channel: DictParameterArrayConfig<GdalSourceChannelOptions>;
}

export interface GdalSourceChannelOptions extends OptionsDict {
    channelNumber: number;
}

/**
 * The raster source type.
 */
export class GdalSourceParameterOptions extends OperatorTypeParameterOptions {

    private channel: DictParameterArray<GdalSourceChannelOptions>;

    constructor(config: GdalSourceParameterOptionsConfig) {
        super(config);
        this.channel = DictParameterArray.fromDict<GdalSourceChannelOptions>(config.channel);
    }

    static fromDict(dict: GdalSourceParameterOptionsConfig) {
        return new GdalSourceParameterOptions(dict);
    }

    getParameterOptions(): Array<[ParameterName, DictParameterArray<OptionsDict>]> {
        return [
            ['channel', this.channel]
        ];
    }

    toDict(): GdalSourceParameterOptionsConfig {
        return {
            operatorType: GdalSourceType.TYPE,
            channel: this.channel.toDict(),
        };
    }

    getParametersTypes(): Array<[ParameterName, ParameterOptionType]> {
        return [
            ['channel', this.channel.parameterType]
        ];
    }

}
