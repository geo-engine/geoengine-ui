// export interface OperatorTypeConfig {} // tslint:disable-line:no-empty-interface

/**
 * Options allowed when cloning the operator
 */
export interface OperatorTypeCloneOptions {
} // tslint:disable-line:no-empty-interface

/**
 * Dictionary for serializing the operator type.
 */
export interface OperatorTypeDict {
    operatorType: string;
}

/**
 * Interface required for complex operator parameter options.
 * It represents display values of type options.
 */
export interface OptionsDict {
    displayValue: string;
}

/**
 * The possible types of parameter values
 */
export type ParameterValue = number | string | OptionsDict;

/**
 * The operator basic type.
 */
export abstract class OperatorType {

    /**
     * Human-readable type name.
     */
    abstract toString(): string;

    /**
     * Serialize the operator type.
     */
    abstract toDict(): OperatorTypeDict;

    /**
     * Icon respresentation of the operator.
     */
    abstract getIconUrl(): string;

    /**
     * Get the value of a parameter
     */
    public getParameterValue(parameterName: string): ParameterValue | undefined {
        return undefined;
    }

    /**
     * Get the DisplayValue of a parameter
     */
    public getParameterDisplayValue(parameterName: string): string | undefined {
        const parameterValue = this.getParameterValue(parameterName);
        if (!parameterValue) {
            return undefined;
        }
        // parameters are either objects of 'OptionDict' i.e. they have a 'displayValue' or 'number | string'
        if (typeof parameterValue === 'object') {
            return parameterValue.displayValue;
        }
        return parameterValue.toString();
    }

    /**
     * Get a human readable parameter list.
     */
    abstract getParametersAsStrings(): Array<[string, string]>;

    /**
     * clone an operator type with modified parameters
     * @param options a dictionary with modifications
     */
    abstract cloneWithModifications(options?: OperatorTypeCloneOptions): OperatorType;
}
