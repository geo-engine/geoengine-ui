export type ParameterName = string;

export const enum ParameterType {
    NUMBER_ARRAY,
    STRING_ARRAY,
    NUMBER_RANGE,
    DICT_ARRAY
}

export interface ParameterOptionsNumberArrayConfig {
    kind: ParameterType.NUMBER_ARRAY;
    options: Array<number>;
}

export interface ParameterOptionsStringArrayConfig {
    kind: ParameterType.STRING_ARRAY;
    options: Array<string>;
}

export interface ParameterOptionsDictArrayConfig {
    kind: ParameterType.DICT_ARRAY;
    options: Array<{}>;
}

export interface ParameterOptionsNumberRangeConfig {
    kind: ParameterType.NUMBER_RANGE;
    start: number,
    stop: number,
    step?: number
}

export type ParameterOptionsConfig = ParameterOptionsNumberArrayConfig
    | ParameterOptionsStringArrayConfig
    | ParameterOptionsNumberRangeConfig
    | ParameterOptionsDictArrayConfig;

export abstract class ParameterOption {
    abstract get parameterType(): ParameterType;

    static fromDict(dict: ParameterOptionsConfig) {
        switch (dict.kind) {
            case ParameterType.NUMBER_ARRAY:
                return ParameterOptionsNumberArray.fromDict(dict as ParameterOptionsNumberArrayConfig);
            case ParameterType.STRING_ARRAY:
                return ParameterOptionsStringArray.fromDict(dict as ParameterOptionsStringArrayConfig);
            case ParameterType.NUMBER_RANGE:
                return ParameterOptionsNumberRange.fromDict(dict as ParameterOptionsNumberRangeConfig);
            case ParameterType.DICT_ARRAY:
                return ParameterOptionsDictArray.fromDict(dict as ParameterOptionsDictArrayConfig);
            default:
                throw new Error('unknown ParameterType');
        }
    }
}

export class ParameterOptionsNumberArray extends ParameterOption {
    options: Array<number>;

    constructor(config: ParameterOptionsNumberArrayConfig) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterType {
        return ParameterType.NUMBER_ARRAY;
    }

    static fromDict(dict: ParameterOptionsNumberArrayConfig) {
        return new  ParameterOptionsNumberArray(dict);
    }

    toDict(): ParameterOptionsNumberArrayConfig {
        return {
            options: this.options,
            kind: ParameterType.NUMBER_ARRAY
        }
    }
}

export class ParameterOptionsStringArray extends ParameterOption {
    options: Array<string>;

    constructor(config: ParameterOptionsStringArrayConfig) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterType {
        return ParameterType.STRING_ARRAY;
    }

    static fromDict(dict: ParameterOptionsStringArrayConfig) {
        return new  ParameterOptionsStringArray(dict);
    }
}

export class ParameterOptionsNumberRange extends ParameterOption {
    start: number;
    stop: number;
    step = 1;

    constructor(config: ParameterOptionsNumberRangeConfig) {
        super();
        this.start = config.start;
        this.stop = config.stop;
        this.step = config.step ? config.step : 1;
    }

    get parameterType(): ParameterType {
        return ParameterType.NUMBER_RANGE;
    }

    static fromDict(dict: ParameterOptionsNumberRangeConfig) {
        return new  ParameterOptionsNumberRange(dict);
    }

    get array(): Array<number> {
        return
    }

    toDict(): ParameterOptionsNumberRangeConfig {
        return {
            start: this.start,
            stop: this.stop,
            step: this.step,
            kind: ParameterType.NUMBER_RANGE
        }
    }
}

export class ParameterOptionsDictArray extends ParameterOption {
    options: Array<{}>;

    constructor(config: ParameterOptionsDictArrayConfig) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterType {
        return ParameterType.DICT_ARRAY;
    }

    static fromDict(dict: ParameterOptionsDictArrayConfig): ParameterOptionsDictArray {
        return new  ParameterOptionsDictArray(dict);
    }

    toDict(): ParameterOptionsDictArrayConfig {
        return {
            options: this.options,
            kind: ParameterType.DICT_ARRAY,
        }
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

    public abstract getParametersTypes(): Array<[ParameterName, ParameterType]>;

    public getParameterNames(): Array<ParameterName> {
        return this.getParametersTypes().map(([n, _]) => n);
    }

    // abstract generateOperatorConfigOption()
}

export class EmptyParameterOptions extends OperatorTypeParameterOptions {
    constructor () {
        super({operatorType: 'empty dummy'})
    }

    getParameterOptions(): Array<[ParameterName, ParameterOption]> {
        return [];
    }

    getParametersTypes(): Array<[ParameterName, ParameterType]> {
        return [];
    }

    toDict(): OperatorTypeParameterOptionsDict {
        return undefined;
    }

}
