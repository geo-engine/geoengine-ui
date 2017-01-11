import {DialogRef} from './dialog-ref.model';

/**
 * The base class for each wave dialog.
 * Extends Function only for the purpose of letting the component resolver use it as a Type.
 */
export abstract class BasicDialog<CustomDialogInput extends DialogInput> extends Function {
    // the following properties get injected by the dialog loader.
    dialog: DialogRef;

    dialogInput: CustomDialogInput;
}

/**
 * A `BasicDialog` without (known) input.
 */
export abstract class DefaultBasicDialog extends BasicDialog<DialogInput> {}

/**
 * An input interface for dialog input.
 */
export interface DialogInput {
    [index: string]: string | number | boolean | Object;
}
