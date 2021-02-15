/**
 * A class about a raster data type.
 */
export abstract class RasterDataType {
    /**
     * Create a human readable output of the data type.
     * @returns The name.
     */
    abstract toString(): string;

    /**
     * @return The name of the data type.
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

class Byte extends RasterDataType {
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

class Int16 extends RasterDataType {
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

class UInt16 extends RasterDataType {
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

class Int32 extends RasterDataType {
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

class UInt32 extends RasterDataType {
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

class Float32 extends RasterDataType {
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

class Float64 extends RasterDataType {
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

class Alphanumeric extends RasterDataType {
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

export class RasterDataTypeCollection {
    static readonly INSTANCE = new RasterDataTypeCollection();

    // tslint:disable:variable-name
    Byte: RasterDataType = new Byte();
    Int16: RasterDataType = new Int16();
    UInt16: RasterDataType = new UInt16();
    Int32: RasterDataType = new Int32();
    UInt32: RasterDataType = new UInt32();
    Float32: RasterDataType = new Float32();
    Float64: RasterDataType = new Float64();
    Alphanumeric: RasterDataType = new Alphanumeric();
    // tslint:enable

    ALL_DATATYPES: Array<RasterDataType>;
    ALL_NUMERICS: Array<RasterDataType>;

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

export const RasterDataTypes = RasterDataTypeCollection.INSTANCE; // tslint:disable-line:variable-name

export abstract class VectorDataType {
    /**
     * Create a human readable output of the data type.
     * @returns The name.
     */
    toString(): string {
        return this.getCode();
    };

    /**
     * @return The name of the data type.
     */
    abstract getCode(): string;
}

class Data extends VectorDataType {
    getCode(): string {
        return 'Data';
    }
}

class MultiPoint extends VectorDataType {
    getCode(): string {
        return 'MultiPoint';
    }
}

class MultiLineString extends VectorDataType {
    getCode(): string {
        return 'MultiLineString';
    }
}

class MultiPolygon extends VectorDataType {
    getCode(): string {
        return 'MultiPoint';
    }
}

export class VectorDataTypeCollection {
    static readonly INSTANCE = new VectorDataTypeCollection();

    // tslint:disable:variable-name
    Data: VectorDataType = new Data();
    MultiPoint: VectorDataType = new MultiPoint();
    MultiLineString: VectorDataType = new MultiLineString();
    MultiPolygon: VectorDataType = new MultiPolygon();

    fromCode(code: string) {
        switch (code) {
            case this.Data.getCode():
                return this.Data;
            case this.MultiPoint.getCode():
                return this.MultiPoint;
            case this.MultiLineString.getCode():
                return this.MultiLineString;
            case this.MultiPolygon.getCode():
            default:
                throw new Error(`Invalid Data Type: ${code}`);
        }
    }
}

export const VectorDataTypes = VectorDataTypeCollection.INSTANCE; // tslint:disable-line:variable-name
