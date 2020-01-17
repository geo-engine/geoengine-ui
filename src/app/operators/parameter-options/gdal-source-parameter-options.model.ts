import {
    ParameterName,
    ParameterOptionType,
    OperatorTypeParameterOptions,
    OperatorTypeParameterOptionsConfig,
    OperatorTypeParameterOptionsDict,
    ParameterOptionDictArray,
    ParameterOptionDictArrayConfig,
    OptionsDict
} from '../operator-type-parameter-options.model';

import {GdalSourceType} from '../types/gdal-source-type.model';

interface GdalSourceParameterOptionsConfig extends OperatorTypeParameterOptionsConfig {
    channel: ParameterOptionDictArrayConfig<GdalSourceChannelOptions>;
}

export interface GdalSourceParameterOptionsDict extends OperatorTypeParameterOptionsDict  {
    channel: ParameterOptionDictArrayConfig<GdalSourceChannelOptions>;
}

export interface GdalSourceChannelOptions extends OptionsDict {
    channelNumber: number;
}

/**
 * The raster source type.
 */
export class GdalSourceParameterOptions extends OperatorTypeParameterOptions {

    private channel: ParameterOptionDictArray<GdalSourceChannelOptions>;

    constructor(config: GdalSourceParameterOptionsConfig) {
        super(config);
        this.channel = ParameterOptionDictArray.fromDict<GdalSourceChannelOptions>(config.channel);
    }

    static fromDict(dict: GdalSourceParameterOptionsDict) {
        return new GdalSourceParameterOptions(dict);
    }

    getParameterOptions(): Array<[ParameterName, ParameterOptionDictArray<OptionsDict>]> {
        return [
            ['channel', this.channel]
        ];
    }

    toDict(): GdalSourceParameterOptionsDict {
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
