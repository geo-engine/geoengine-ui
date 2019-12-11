import {
    ParameterName,
    ParameterType,
    OperatorTypeParameterOptions,
    OperatorTypeParameterOptionsConfig,
    OperatorTypeParameterOptionsDict,
    ParameterOptionsNumberRangeConfig,
    ParameterOptionsNumberRange
} from '../operator-type-parameter-options.model';

import {GdalSourceType} from '../types/gdal-source-type.model';

interface GdalSourceParameterOptionsConfig extends OperatorTypeParameterOptionsConfig {
    channel: ParameterOptionsNumberRangeConfig;
}

export interface GdalSourceParameterOptionsDict extends OperatorTypeParameterOptionsDict  {
    channel: ParameterOptionsNumberRangeConfig;
}

/**
 * The raster source type.
 */
export class GdalSourceParameterOptions extends OperatorTypeParameterOptions {

    private channel: ParameterOptionsNumberRange;

    constructor(config: GdalSourceParameterOptionsConfig) {
        super(config);
        this.channel = ParameterOptionsNumberRange.fromDict(config.channel);
    }

    static fromDict(dict: GdalSourceParameterOptionsDict) {
        return new GdalSourceParameterOptions(dict);
    }

    getParameterOptions(): Array<[ParameterName, ParameterOptionsNumberRange]> {
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

    getParametersTypes(): Array<[ParameterName, ParameterType]> {
        return [
            ['channel', this.channel.parameterType]
        ];
    }

}
