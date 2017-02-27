import {AbstractControl} from '@angular/forms';

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
