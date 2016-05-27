import {DialogRef} from './dialog-ref.model';

/**
 * The base class for each wave dialog.
 * Extends Function only for the purpose of letting the component resolver use it as a Type.
 */
export abstract class BasicDialog extends Function {
    // the following properties get injected by the dialog loader.
    dialog: DialogRef;

    // the following properties get extracted by the dialog loader.
    abstract title: string;
    abstract buttons: Array<ButtonDescription>;
}

/**
 * A description interface for dialog buttons.
 */
export interface ButtonDescription {
    title: string;
    class?: string;
    action: Function;
}
