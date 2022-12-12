import {GeoEngineErrorDict} from '../backend/backend.model';

/**
 * Error when getting an unexpected result type.
 */
export class UnexpectedResultType extends Error {
    constructor() {
        super('Unexpected Result Type');
    }
}

/**
 * Wrapper error type for server errors
 */
export class GeoEngineError extends Error {
    constructor(error: string, message: string) {
        super(message);
        this.name = error;
    }

    static fromDict(dict: GeoEngineErrorDict): GeoEngineError {
        return new GeoEngineError(dict.error, dict.message);
    }
}
