export type ParameterName = string;

export const enum ParameterOptionType {
    NUMBER_ARRAY,
    STRING_ARRAY,
    NUMBER_RANGE,
    DICT_ARRAY
}

export interface ParameterOptionsNumberArrayConfig {
    kind: ParameterOptionType.NUMBER_ARRAY;
    options: Array<number>;
}

export interface ParameterOptionStringArrayConfig {
    kind: ParameterOptionType.STRING_ARRAY;
    options: Array<string>;
}

export interface ParameterOptionsNumberRangeConfig {
    kind: ParameterOptionType.NUMBER_RANGE;
    start: number,
    stop: number,
    step?: number
}

export interface OptionsDict {
    displayValue: string;
}

export interface ParameterOptionDictArrayConfig<T extends OptionsDict> {
    kind: ParameterOptionType.DICT_ARRAY;
    options: Array<T>;
}

export type ParameterOption = ParameterOptionNumberArray | ParameterOptionNumberRange | ParameterOptionStringArray
    | ParameterOptionDictArray<OptionsDict>;

export abstract class AbstractParameterOption<T> {
    abstract get parameterType(): ParameterOptionType;
    public optionCount(): number {
        return this.optionsAsArray.length;
    }
    abstract get optionsAsArray(): Array<T>;
    abstract get displayValuesAsArray(): Array<string>;
}

export class ParameterOptionNumberArray extends AbstractParameterOption<number> {
    options: Array<number>;

    constructor(config: ParameterOptionsNumberArrayConfig) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.NUMBER_ARRAY;
    }

    static fromDict(dict: ParameterOptionsNumberArrayConfig) {
        return new  ParameterOptionNumberArray(dict);
    }

    toDict(): ParameterOptionsNumberArrayConfig {
        return {
            options: this.options,
            kind: ParameterOptionType.NUMBER_ARRAY
        }
    }

    get displayValuesAsArray(): Array<string> {
        return this.options.map(x => x.toString());
    }

    get optionsAsArray(): Array<number> {
        return this.options;
    }
}

export class ParameterOptionStringArray extends AbstractParameterOption<string> {
    options: Array<string>;

    constructor(config: ParameterOptionStringArrayConfig) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.STRING_ARRAY;
    }

    static fromDict(dict: ParameterOptionStringArrayConfig) {
        return new  ParameterOptionStringArray(dict);
    }

    get displayValuesAsArray(): Array<string> {
        return this.options.map(x => x.toString());
    }

    get optionsAsArray(): Array<string> {
        return this.options;
    }
}

export class ParameterOptionNumberRange extends AbstractParameterOption<number> {
    start: number;
    stop: number;
    step = 1;

    _array: Array<number>;

    constructor(config: ParameterOptionsNumberRangeConfig) {
        super();
        this.start = config.start;
        this.stop = config.stop;
        this.step = config.step ? config.step : 1;
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.NUMBER_RANGE;
    }

    static fromDict(dict: ParameterOptionsNumberRangeConfig) {
        return new  ParameterOptionNumberRange(dict);
    }

    toDict(): ParameterOptionsNumberRangeConfig {
        return {
            start: this.start,
            stop: this.stop,
            step: this.step,
            kind: ParameterOptionType.NUMBER_RANGE
        }
    }

    private generateArray() {
        if ( !this._array ) {
            this._array = [];
            for (let i = this.start; i < this.stop; i += this.step) {
                this._array.push(i);
            }
        }
    }

    get displayValuesAsArray(): Array<string> {
        this.generateArray();
        return this._array.map(x => x.toString());
    }

    public optionCount(): number {
        this.generateArray();
        return this._array.length;
    }

    get optionsAsArray(): Array<number> {
        this.generateArray();
        return this._array;
    }
}

export class ParameterOptionDictArray<T extends OptionsDict> extends AbstractParameterOption<T> {
    options: Array<T>;

    constructor(config: ParameterOptionDictArrayConfig<T>) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.DICT_ARRAY;
    }

    static fromDict<T extends OptionsDict>(dict: ParameterOptionDictArrayConfig<T>): ParameterOptionDictArray<T> {
        return new  ParameterOptionDictArray(dict);
    }

    toDict(): ParameterOptionDictArrayConfig<T> {
        return {
            options: this.options,
            kind: ParameterOptionType.DICT_ARRAY,
        }
    }

    get displayValuesAsArray(): Array<string> {
        return this.options.map(o => o.displayValue);
    }

    get optionsAsArray(): Array<T> {
        return this.options;
    }
}


/**
 * Dictionary for serializing the operator type.
 */
export interface OperatorTypeParameterOptionsDict {
    operatorType: string;
}

export interface OperatorTypeParameterOptionsConfig {
    operatorType: string;
}

/**
 * The operator basic type.
 */
export abstract class OperatorTypeParameterOptions {
    operatorType: string;

    constructor(config: OperatorTypeParameterOptionsConfig) {
        this.operatorType = config.operatorType;
    }

    static empty(): EmptyParameterOptions {
        return new EmptyParameterOptions()
    }

    /**
     * Serialize the operator type.
     */
    abstract toDict(): OperatorTypeParameterOptionsDict;

    public getParameterOption(parameterName: ParameterName): ParameterOption | undefined {
        const res: [ParameterName, ParameterOption] | undefined = this.getParameterOptions().find(([pN, pO]) => pN === parameterName);
        if (!res) {
            return undefined;
        }
        const [ , pOption] = res;
        return pOption;
    }

    public abstract getParameterOptions(): Array<[ParameterName, ParameterOption]>;

    public abstract getParametersTypes(): Array<[ParameterName, ParameterOptionType]>;

    public getParameterNames(): Array<ParameterName> {
        return this.getParametersTypes().map(([n, _]) => n);
    }
}

export class EmptyParameterOptions extends OperatorTypeParameterOptions {
    constructor () {
        super({operatorType: 'EMPTY_PARAMETER_OPTIONS'})
    }

    getParameterOptions(): Array<[ParameterName, ParameterOption]> {
        return [];
    }

    getParametersTypes(): Array<[ParameterName, ParameterOptionType]> {
        return [];
    }

    toDict(): OperatorTypeParameterOptionsDict {
        return undefined;
    }

}
