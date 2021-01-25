/**
 * A class about a data type.
 */
export abstract class DataType {
    /**
     * Create a human readable output of the data type.
     * @returns The name.
     */
    abstract toString(): string;

    /**
     * @return The name of the projection.
     */
    abstract getCode(): string;

    /**
     * @return the largest value.
     */
    abstract getMin(): number;

    /**
     * @return the smallest value.
     */
    abstract getMax(): number;
}

class Byte extends DataType {
    toString(): string {
        return 'Byte';
    }

    getCode(): string {
        return 'U8';
    }

    getMin(): number {
        return 0;
    }

    getMax(): number {
        return 255;
    }
}

class Int16 extends DataType {
    toString(): string {
        return 'Int 16';
    }

    getCode(): string {
        return 'I16';
    }

    getMin(): number {
        return -32768;
    }

    getMax(): number {
        return 32767;
    }
}

class UInt16 extends DataType {
    toString(): string {
        return 'Unsigned Int 16';
    }

    getCode(): string {
        return 'U16';
    }

    getMin(): number {
        return 0;
    }

    getMax(): number {
        return 65535;
    }
}

class Int32 extends DataType {
    toString(): string {
        return 'Int 32';
    }

    getCode(): string {
        return 'I32';
    }

    getMin(): number {
        return -2147483648;
    }

    getMax(): number {
        return 2147483647;
    }
}

class UInt32 extends DataType {
    toString(): string {
        return 'Unsigned Int 32';
    }

    getCode(): string {
        return 'U32';
    }

    getMin(): number {
        return 0;
    }

    getMax(): number {
        return 4294967295;
    }
}

class Float32 extends DataType {
    toString(): string {
        return 'Float 32';
    }

    getCode(): string {
        return 'F32';
    }

    getMin(): number {
        return Number.POSITIVE_INFINITY;
    }

    getMax(): number {
        return Number.NEGATIVE_INFINITY;
    }
}

class Float64 extends DataType {
    toString(): string {
        return 'Float 64';
    }

    getCode(): string {
        return 'F64';
    }

    getMin(): number {
        return Number.POSITIVE_INFINITY;
    }

    getMax(): number {
        return Number.NEGATIVE_INFINITY;
    }
}

class Alphanumeric extends DataType {
    toString(): string {
        return 'String';
    }

    getCode(): string {
        return 'Alphanumeric';
    }

    getMin(): number {
        return undefined;
    }

    getMax(): number {
        return undefined;
    }
}

export class DataTypeCollection {
    static readonly INSTANCE = new DataTypeCollection();

    // tslint:disable:variable-name
    Byte: DataType = new Byte();
    Int16: DataType = new Int16();
    UInt16: DataType = new UInt16();
    Int32: DataType = new Int32();
    UInt32: DataType = new UInt32();
    Float32: DataType = new Float32();
    Float64: DataType = new Float64();
    Alphanumeric: DataType = new Alphanumeric();
    // tslint:enable

    ALL_DATATYPES: Array<DataType>;
    ALL_NUMERICS: Array<DataType>;

    protected constructor() {
        this.ALL_DATATYPES = [
            this.Byte, this.Int16, this.UInt16, this.Int32, this.UInt32, this.Float32, this.Float64,
            this.Alphanumeric,
        ];
        this.ALL_NUMERICS = [
            this.Byte, this.Int16, this.UInt16, this.Int32, this.UInt32, this.Float32, this.Float64,
        ];
    }

    fromCode(code: string) {
        switch (code) {
            case this.Byte.getCode():
                return this.Byte;
            case this.Int16.getCode():
                return this.Int16;
            case this.UInt16.getCode():
                return this.UInt16;
            case this.Int32.getCode():
                return this.Int32;
            case this.UInt32.getCode():
                return this.UInt32;
            case this.Float32.getCode():
                return this.Float32;
            case this.Float64.getCode():
                return this.Float64;
            case this.Alphanumeric.getCode():
                return this.Alphanumeric;
            default:
                throw new Error(`Invalid Data Type: ${code}`);
        }
    }
}

export const DataTypes = DataTypeCollection.INSTANCE; // tslint:disable-line:variable-name
