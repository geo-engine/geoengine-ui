import {OperatorTypeParameterOptions, OperatorTypeParameterOptionsConfig} from '../operator-type-parameter-options.model';
// import {GdalSourceParameterOptions, GdalSourceParameterOptionsConfig} from './gdal-source-parameter-options.model';
// import {GdalSourceType} from '../types/gdal-source-type.model';

/**
 * A simple factory for de-serializing operator parameter options.
 */
export abstract class OperatorTypeParameterOptionsFactory {
    /**
     * Create operator type from serialized data.
     */
    static fromDict(dict: OperatorTypeParameterOptionsConfig): OperatorTypeParameterOptions {
        switch (dict.operatorType) {
            // case GdalSourceType.TYPE:
            //     return GdalSourceParameterOptions.fromDict(dict as GdalSourceParameterOptionsConfig);
            default:
                throw Error('There is not ParameterOptions factory method defined for the "' + dict.operatorType + '" type.');
        }
    }
}
