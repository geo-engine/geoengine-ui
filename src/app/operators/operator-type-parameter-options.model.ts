export type ParameterName = string;

export const enum ParameterOptionType {
    NUMBER_ARRAY,
    STRING_ARRAY,
    NUMBER_RANGE,
    DICT_ARRAY,
    EMPTY,
}

export interface NumberParameterArrayConfig {
    kind: ParameterOptionType.NUMBER_ARRAY;
    options: Array<number>;
}

export interface EmptyContainerConfig {
    kind: ParameterOptionType.EMPTY;
}

export interface StringParameterArrayConfig {
    kind: ParameterOptionType.STRING_ARRAY;
    options: Array<string>;
}

export interface NumberParameterRangeConfig {
    kind: ParameterOptionType.NUMBER_RANGE;
    start: number,
    stop: number,
    step?: number
}

export interface OptionsDict {
    displayValue: string;
}

export interface DictParameterArrayConfig<T extends OptionsDict> {
    kind: ParameterOptionType.DICT_ARRAY;
    options: Array<T>;
}

export type ParameterContainerType =
    EmptyParameterContainer
    | NumberParameterArray
    | NumberParameterRange
    | StringParameterArray
    | DictParameterArray<OptionsDict>;

export abstract class AbstractParameterContainer<T> {

    abstract get parameterType(): ParameterOptionType;

    public getOptionCount(): number {
        return this.listOfOptions.length;
    }

    abstract get listOfOptions(): Array<T>;

    abstract get listOfDisplayValues(): Array<string>;

    static getEmptyOption(): EmptyParameterContainer {
        return _emptyOption;
    }
}

export class EmptyParameterContainer extends AbstractParameterContainer<number | string> {

    constructor() {
        super();
    }

    get listOfDisplayValues(): Array<string> {
        return [];
    }

    get listOfOptions(): Array<number | string> {
        return [];
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.EMPTY;
    }

}

const _emptyOption = new EmptyParameterContainer();

export class NumberParameterArray extends AbstractParameterContainer<number> {
    options: Array<number>;

    constructor(config: NumberParameterArrayConfig) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.NUMBER_ARRAY;
    }

    static fromDict(dict: NumberParameterArrayConfig) {
        return new NumberParameterArray(dict);
    }

    toDict(): NumberParameterArrayConfig {
        return {
            options: this.options,
            kind: ParameterOptionType.NUMBER_ARRAY
        };
    }

    get listOfDisplayValues(): Array<string> {
        return this.options.map(x => x.toString());
    }

    get listOfOptions(): Array<number> {
        return this.options;
    }
}

export class StringParameterArray extends AbstractParameterContainer<string> {
    options: Array<string>;

    constructor(config: StringParameterArrayConfig) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.STRING_ARRAY;
    }

    static fromDict(dict: StringParameterArrayConfig) {
        return new StringParameterArray(dict);
    }

    get listOfDisplayValues(): Array<string> {
        return this.options.map(x => x.toString());
    }

    get listOfOptions(): Array<string> {
        return this.options;
    }
}

export class NumberParameterRange extends AbstractParameterContainer<number> {
    start: number;
    stop: number;
    step = 1;

    _array: Array<number>;

    constructor(config: NumberParameterRangeConfig) {
        super();
        this.start = config.start;
        this.stop = config.stop;
        this.step = config.step ? config.step : 1;
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.NUMBER_RANGE;
    }

    static fromDict(dict: NumberParameterRangeConfig) {
        return new NumberParameterRange(dict);
    }

    toDict(): NumberParameterRangeConfig {
        return {
            start: this.start,
            stop: this.stop,
            step: this.step,
            kind: ParameterOptionType.NUMBER_RANGE
        };
    }

    private generateArray() {
        if ( !this._array ) {
            this._array = [];
            for (let i = this.start; i < this.stop; i += this.step) {
                this._array.push(i);
            }
        }
    }

    get listOfDisplayValues(): Array<string> {
        this.generateArray();
        return this._array.map(x => x.toString());
    }

    public getOptionCount(): number {
        this.generateArray();
        return this._array.length;
    }

    get listOfOptions(): Array<number> {
        this.generateArray();
        return this._array;
    }
}

export class DictParameterArray<T extends OptionsDict> extends AbstractParameterContainer<T> {
    options: Array<T>;

    constructor(config: DictParameterArrayConfig<T>) {
        super();
        this.options = config.options;
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.DICT_ARRAY;
    }

    static fromDict<T extends OptionsDict>(dict: DictParameterArrayConfig<T>): DictParameterArray<T> {
        return new DictParameterArray(dict);
    }

    toDict(): DictParameterArrayConfig<T> {
        return {
            options: this.options,
            kind: ParameterOptionType.DICT_ARRAY,
        };
    }

    get listOfDisplayValues(): Array<string> {
        return this.options.map(o => o.displayValue);
    }

    get listOfOptions(): Array<T> {
        return this.options;
    }
}


/**
 * Dictionary for serializing the operator type.
 */
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

    /**
     * Serialize the operator type.
     */
    abstract toDict(): OperatorTypeParameterOptionsConfig;

    public getParameterOption(parameterName: ParameterName): ParameterContainerType {
        const res: [ParameterName, ParameterContainerType] = this.getParameterOptions().find(
            ([pN, pO]) => pN === parameterName
        );
        if (!res) {
            return AbstractParameterContainer.getEmptyOption();
        }
        const [_, pOption] = res;
        return pOption;
    }

    public abstract getParameterOptions(): Array<[ParameterName, ParameterContainerType]>;

    public abstract getParametersTypes(): Array<[ParameterName, ParameterOptionType]>;

    public getParameterNames(): Array<ParameterName> {
        return this.getParametersTypes().map(([n, _]) => n);
    }
}
