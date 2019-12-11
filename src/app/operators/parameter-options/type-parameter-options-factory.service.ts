import {OperatorTypeParameterOptions, OperatorTypeParameterOptionsDict} from '../operator-type-parameter-options.model';
import {GdalSourceParameterOptions, GdalSourceParameterOptionsDict} from './gdal-source-parameter-options.model';
import {GdalSourceType} from '../types/gdal-source-type.model';

/**
 * A simple factory for de-serializing operator types.
 */
export abstract class OperatorTypeParameterOptionsFactory {
    /**
     * Create operator type from serialized data.
     */
    static fromDict(dict: OperatorTypeParameterOptionsDict): OperatorTypeParameterOptions {
        switch (dict.operatorType) {
            case GdalSourceType.TYPE:
                return GdalSourceParameterOptions.fromDict(dict as GdalSourceParameterOptionsDict);
            default:
                throw Error('There is not factory method defined for this operator.');
        }
    }
}
