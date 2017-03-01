import {AbstractControl} from '@angular/forms';

/**
 * A validator that validates a form group that contains min/max number fields.
 * @param controlMinName
 * @param controlMaxName
 * @param options
 * @returns {(control:AbstractControl)=>{[p: string]: boolean}}
 */
function minAndMax(controlMinName: string,
                   controlMaxName: string,
                   options?: {
                       checkBothExist?: boolean,
                       checkOneExists?: boolean
                   }) {
    if (!options) {
        options = {};
    }
    if (options.checkBothExist === undefined) {
        options.checkBothExist = false;
    }
    if (options.checkOneExists === undefined) {
        options.checkOneExists = true;
    }

    return (control: AbstractControl): {[key: string]: boolean} => {
        const min = control.get(controlMinName).value;
        const max = control.get(controlMaxName).value;

        const errors: {
            minOverMax?: boolean,
            noFilter?: boolean,
        } = {};

        if (min && max && max < min) {
            errors.minOverMax = true;
        }

        if (options.checkOneExists && (!min && !max)) {
            errors.noFilter = true;
        }

        if (options.checkBothExist && (!min || !max)) {
            errors.noFilter = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };
}

/**
 * A validator that invokes the underlying one only if the condition holds.
 * @param validator
 * @param condition
 * @returns {(control:AbstractControl)=>{[p: string]: boolean}}
 */
function conditionalValidator(validator: (control: AbstractControl) => {[key: string]: boolean},
                              condition: () => boolean) {
    return (control: AbstractControl): {[key: string]: boolean} => {
        if (condition()) {
            return validator(control);
        } else {
            return null;
        }
    };
}

export const WaveValidators = {
    minAndMax: minAndMax,
    conditionalValidator: conditionalValidator,
};
