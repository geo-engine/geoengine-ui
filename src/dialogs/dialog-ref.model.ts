import {Observable, BehaviorSubject} from 'rxjs/Rx';

/**
 * A reference object to dialog loader properties and functions.
 */
export interface DialogRef {
    maxHeight$: Observable<number>;
    maxWidth$: Observable<number>;
    maxHeight: number;
    maxWidth: number;

    setTitle: (title: string) => void;
    setButtons: (buttons: Array<ButtonDescription>) => void;
    setOverflows: (overflows: boolean) => void;
    setSideMargins: (sideMargins: boolean) => void;

    close(): void;
}

/**
 * A description interface for dialog buttons.
 */
export interface ButtonDescription {
    title: string;
    class?: string;
    action: Function;
    disabled?: BehaviorSubject<boolean>;
}

/**
 * A description interface for an action input.
 */
export interface ActionInputDescription {
    label: string;
    value?: BehaviorSubject<string | number>;
    minLength?: number;
    maxLength?: number;
}
