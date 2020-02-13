import {
    DictParameterArray,
    DictParameterArrayConfig,
    OperatorTypeParameterOptions,
    OperatorTypeParameterOptionsConfig,
    ParameterName,
    ParameterOptionType
} from '../operator-type-parameter-options.model';

import {GdalSourceType} from '../types/gdal-source-type.model';
import {OptionsDict} from '../operator-type.model';

export interface GdalSourceParameterOptionsConfig extends OperatorTypeParameterOptionsConfig {
    channelConfig: DictParameterArrayConfig<GdalSourceChannelOptions>;
}

export interface GdalSourceChannelOptions extends OptionsDict {
    channelNumber: number;
}

/**
 * The raster source type.
 */
export class GdalSourceParameterOptions extends OperatorTypeParameterOptions {

    private channelConfig: DictParameterArray<GdalSourceChannelOptions>;

    constructor(config: GdalSourceParameterOptionsConfig) {
        super(config);
        this.channelConfig = DictParameterArray.fromDict<GdalSourceChannelOptions>(config.channelConfig);
    }

    static fromDict(dict: GdalSourceParameterOptionsConfig) {
        return new GdalSourceParameterOptions(dict);
    }

    getParameterOptions(): Array<[ParameterName, DictParameterArray<OptionsDict>]> {
        return [
            ['channelConfig', this.channelConfig]
        ];
    }

    toDict(): GdalSourceParameterOptionsConfig {
        return {
            operatorType: GdalSourceType.TYPE,
            channelConfig: this.channelConfig.toDict(),
        };
    }

    getParametersTypes(): Array<[ParameterName, ParameterOptionType]> {
        return [
            ['channelConfig', this.channelConfig.parameterType]
        ];
    }

}
