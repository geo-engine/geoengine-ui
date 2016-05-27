import {Observable} from 'rxjs/Rx';

/**
 * A reference object to dialog loader properties and functions.
 */
export interface DialogRef {
    maxHeight$: Observable<number>;
    maxWidth$: Observable<number>;
    maxHeight: number;
    maxWidth: number;

    close(): void;
}
