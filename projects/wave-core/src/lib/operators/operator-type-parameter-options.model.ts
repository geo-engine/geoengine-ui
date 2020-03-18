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

export abstract class AbstractParameterContainer<T> {

    abstract get parameterType(): ParameterOptionType;

    abstract get tickType(): TickType;

    abstract getDisplayValueForTick(tick: number): string | undefined;

    containsValue(value: T): boolean {
        return !!(this.getTickForValue(value));
    }

    abstract getValueForTick(tick: number): T | undefined;

    abstract getTickForValue(value: T): number | undefined;

    isValidTick(tick: number): boolean {

        if (tick < this.firstTick || tick > this.lastTick) {
            return false;
        }
        if (this.tickType === TickType.DISCRETE) {
            return Number.isInteger(tick);
        }
        return true;
    }

    abstract get firstTick(): number;

    abstract get lastTick(): number;

    get tickStepSize(): number {
        return 1;
    }

    hasTicks() {
        return this.firstTick < this.lastTick;
    }

    static getEmptyOption(): EmptyParameterContainer {
        return EMPTY_OPTION;
    }
}

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

const EMPTY_OPTION = new EmptyParameterContainer();

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

export class NumberParameterRange extends AbstractParameterContainer<number> {
    start: number;
    stop: number;
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

    public abstract getParameterOptions(): Array<[ParameterName, ParameterContainerType]>;

    public abstract getParametersTypes(): Array<[ParameterName, ParameterOptionType]>;

    public getParameterNames(): Array<ParameterName> {
        return this.getParametersTypes().map(([n, _]) => n);
    }
}
