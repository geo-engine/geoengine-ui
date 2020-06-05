import {OptionsDict} from './operator-type.model';

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
    start: number;
    stop: number;
    step?: number;
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

export enum TickType {
    DISCRETE,
    CONTINUOUS
}

/**
 * Parameter option container provide the valid inputs for operator parematers.
 * This is abstracted by ticks which are either in a numberic space or an enumeration of predefined values.
 */
export abstract class AbstractParameterContainer<T> {

    /**
     * Get the parameter type.
     */
    abstract get parameterType(): ParameterOptionType;

    /**
     * Get the tick type, which indicates how to step through options.
     */
    abstract get tickType(): TickType;

    /**
     * Get a display value for a tick.
     */
    abstract getDisplayValueForTick(tick: number): string | undefined;

    /**
     * Check if a value is in this option container.
     */
    containsValue(value: T): boolean {
        return !!(this.getTickForValue(value));
    }

    /**
     * Get the value for a tick.
     */
    abstract getValueForTick(tick: number): T | undefined;

    /**
     * Get the tick for a value.
     */
    abstract getTickForValue(value: T): number | undefined;

    /**
     * Check if a tick is valid.
     */
    isValidTick(tick: number): boolean {

        if (tick < this.firstTick || tick > this.lastTick) {
            return false;
        }
        if (this.tickType === TickType.DISCRETE) {
            return Number.isInteger(tick);
        }
        return true;
    }

    /**
     * Get the first possible tick.
     */
    abstract get firstTick(): number;

    /**
     * Get the last possible tick.
     */
    abstract get lastTick(): number;

    /**
     * Get the tick step size. Default = 1.
     */
    get tickStepSize(): number {
        return 1;
    }

    /**
     * Check if the container has ticks.
     */
    hasTicks() {
        return this.firstTick < this.lastTick;
    }

    /**
     * Generate an empty parameter option container.
     */
    static getEmptyOption(): EmptyParameterContainer {
        return EMPTY_OPTION;
    }
}

/**
 * An empty parameter option container.
 */
export class EmptyParameterContainer extends AbstractParameterContainer<number | string> {

    constructor() {
        super();
    }

    get parameterType(): ParameterOptionType {
        return ParameterOptionType.EMPTY;
    }

    get firstTick(): number {
        return 0;
    }

    getDisplayValueForTick(tick: number): string | undefined {
        return undefined;
    }

    getTickForValue(value: number): number | undefined {
        return undefined;
    }

    getValueForTick(tick: number): number | string | undefined {
        return undefined;
    }

    get lastTick(): number {
        return 0;
    }

    get tickType(): TickType {
        return TickType.DISCRETE;
    }

}

/**
 * Singleton empty option container.
 */
const EMPTY_OPTION = new EmptyParameterContainer();

/**
 * A parameter option container for numerical parameters.
 */
export class NumberParameterArray extends AbstractParameterContainer<number> {

    /**
     * The list of all valid options.
     */
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

    get firstTick(): number {
        return 0;
    }

    getDisplayValueForTick(tick: number): string | undefined {
        return this.getValueForTick(tick).toString();
    }

    getTickForValue(value: number): number | undefined {
        const findIndex = this.options.findIndex(x => x === value);
        if (findIndex < 0) {
            return undefined;
        }
        return findIndex;
    }

    getValueForTick(tick: number): number | undefined {
        if (!this.isValidTick(tick)) {
            return undefined;
        }
        return this.options[tick];
    }

    get lastTick(): number {
        return this.options.length - 1;
    }

    get tickType(): TickType {
        return TickType.DISCRETE;
    }

}

/**
 * A parameter option container for string parameters.
 */
export class StringParameterArray extends AbstractParameterContainer<string> {
    /**
     * The list of all valid options.
     */
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

    get firstTick(): number {
        return 0;
    }

    getDisplayValueForTick(tick: number): string | undefined {
        return this.getValueForTick(tick).toString();
    }

    getTickForValue(value: string): number | undefined {
        const findIndex = this.options.findIndex(x => x === value);
        if (findIndex < 0) {
            return undefined;
        }
        return findIndex;
    }

    getValueForTick(tick: number): string | undefined {
        if (!this.isValidTick(tick)) {
            return undefined;
        }
        return this.options[tick];
    }

    get lastTick(): number {
        return this.options.length - 1;
    }

    get tickType(): TickType {
        return TickType.DISCRETE;
    }
}

/**
 * An interface for numeric range parameters.
 */
export class NumberParameterRange extends AbstractParameterContainer<number> {
    /**
     * Range start.
     */
    start: number;
    /**
     * Range end.
     */
    stop: number;
    /**
     * Range step size.
     */
    step = 1;

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

    get firstTick(): number {
        return this.start;
    }

    getDisplayValueForTick(tick: number): string | undefined {
        return this.getValueForTick(tick).toString();
    }

    getTickForValue(value: number): number | undefined {
        return this.getValueForTick(value);
    }

    getValueForTick(tick: number): number | undefined {
        if (!this.isValidTick(tick)) {
            return undefined;
        }
        return tick;
    }

    get lastTick(): number {
        return this.stop;
    }

    get tickStepSize(): number {
        return this.step;
    }

    get tickType(): TickType {
        return TickType.CONTINUOUS;
    }
}

/**
 * An interface for complex parameter options.
 * The type of the option type is generic but has to implement OptionsDict.
 */
export class DictParameterArray<T extends OptionsDict> extends AbstractParameterContainer<T> {
    /**
     * List of all valid options.
     */
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

    get firstTick(): number {
        return 0;
    }

    getDisplayValueForTick(tick: number): string | undefined {
        return this.getValueForTick(tick).displayValue.toString();
    }

    getTickForValue(value: T): number | undefined {
        const findIndex = this.options.findIndex(x => x.displayValue === value.displayValue); // TODO: review if displayValue is distinct
        if (findIndex < 0) {
            return undefined;
        }
        return findIndex;
    }

    getValueForTick(tick: number): T | undefined {
        if (!this.isValidTick(tick)) {
            return undefined;
        }
        return this.options[tick];
    }

    get lastTick(): number {
        return this.options.length - 1;
    }

    get tickType(): TickType {
        return TickType.DISCRETE;
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

    /**
     * Get the parameter option type for a parameter name.
     */
    public getParameterOption(parameterName: ParameterName): ParameterContainerType {
        const res: [ParameterName, ParameterContainerType] = this.getParameterOptions().find(
            ([pN, _]) => pN === parameterName
        );
        if (!res) {
            return AbstractParameterContainer.getEmptyOption();
        }
        const [_, pOption] = res;
        return pOption;
    }

    /**
     * Get the parameter options as array of tuples [ParameterName, ParameterContainerType].
     */
    public abstract getParameterOptions(): Array<[ParameterName, ParameterContainerType]>;

    /**
     * Get the parameter options as array of tuples [ParameterName, ParameterOptionType].
     */
    public abstract getParametersTypes(): Array<[ParameterName, ParameterOptionType]>;

    /**
     * Get a list of all parameter names.
     */
    public getParameterNames(): Array<ParameterName> {
        return this.getParametersTypes().map(([n, _]) => n);
    }
}
