/**
 * Base class for Output Formats
 */
export abstract class OutputFormat {
    protected format: string;
    protected name: string;

    constructor(format: string, name: string) {
        this.format = format;
        this.name = name;
    }

    getFormat(): string {
        return this.format;
    }
    toString(): string {
        return this.name;
    }
}
