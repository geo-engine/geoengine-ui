import {Observable, Observer} from 'rxjs';
import {map} from 'rxjs/operators';
import {AbstractControl, AsyncValidatorFn, ValidationErrors, Validators} from '@angular/forms';

const isFiniteNumber = (value: any): boolean => value !== null && value !== undefined && !isNaN(value) && isFinite(value);

/**
 * A validator that validates a form group that contains min/max number fields.
 */
const minAndMax = (
    controlMinName: string,
    controlMaxName: string,
    options: {
        checkBothExist?: boolean;
        checkOneExists?: boolean;
        mustNotEqual?: boolean;
    } = {},
): ((_: AbstractControl) => ValidationErrors | null) => {
    if (typeof options.checkBothExist !== 'boolean') {
        // default
        options.checkBothExist = false;
    }
    if (typeof options.checkOneExists !== 'boolean') {
        // default
        options.checkOneExists = true;
    }

    return (control: AbstractControl): ValidationErrors | null => {
        const min = control.get(controlMinName)?.value;
        const max = control.get(controlMaxName)?.value;

        const errors: {
            minOverMax?: boolean;
            minEqualsMax?: boolean;
            noFilter?: boolean;
            noFiniteNumber?: boolean;
        } = {};

        const validMin = isFiniteNumber(min);
        const validMax = isFiniteNumber(max);

        if (validMin && validMax && max < min) {
            errors.minOverMax = true;
        }

        if (options.mustNotEqual && min === max) {
            errors.minEqualsMax = true;
        }

        if (options.checkOneExists && !validMin && !validMax) {
            errors.noFilter = true;
        }

        if (options.checkBothExist && (!validMin || !validMax)) {
            errors.noFilter = true;
        }

        if ((!validMin && min !== undefined && min !== null) || (!validMax && max !== undefined && max !== null)) {
            errors.noFiniteNumber = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };
};

/**
 * A validator that invokes the underlying one only if the condition holds.
 */
const conditionalValidator = (validator: (control: AbstractControl) => ValidationErrors | null, condition: () => boolean) => (
    control: AbstractControl,
): {[key: string]: boolean} | null => {
    if (condition()) {
        return validator(control);
    } else {
        return null;
    }
};

/**
 * Checks if keyword is a reserved keyword.
 */
const keywordValidator = (keywords: Array<string>) => (control: AbstractControl): {keyword: true} | null =>
    keywords.indexOf(control.value) >= 0 ? {keyword: true} : null;

/**
 * Checks if the project name is unique.
 */
const uniqueProjectNameValidator = (storageService: {projectExists(_: string): Observable<boolean>}): AsyncValidatorFn => (
    control: AbstractControl,
): Observable<ValidationErrors | null> =>
    new Observable((observer: Observer<ValidationErrors | null>) => {
        storageService
            .projectExists(control.value as string)
            .pipe(
                map((projectExists) => {
                    const errors: {
                        nameInUsage?: boolean;
                    } = {};

                    if (projectExists) {
                        errors.nameInUsage = true;
                    }

                    return Object.keys(errors).length > 0 ? errors : null;
                }),
            )
            .subscribe(
                (errors) => {
                    observer.next(errors);
                    observer.complete();
                },
                (error) => {
                    observer.error(error);
                },
            );
    });

const notOnlyWhitespace = (control: AbstractControl): {onlyWhitespace: true} | null => {
    const text = control.value as string;
    if (!text) {
        return null;
    }
    return text.trim().length <= 0 ? {onlyWhitespace: true} : null;
};

const isNumber = (control: AbstractControl): {isNoNumber: true} | null => {
    const value = control.value;
    return isFiniteNumber(value) ? null : {isNoNumber: true};
};

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WaveValidators = {
    conditionalValidator,
    isNumber,
    keyword: keywordValidator,
    minAndMax,
    notOnlyWhitespace,
    uniqueProjectName: uniqueProjectNameValidator,
};

/**
 * checks if a value is undefined or null
 */
const nullOrUndefined = (value: any): boolean => value === undefined || value === null;

/**
 * This Validator checks the relation of a value compared to another value.
 *
 * @param controlValueProvider: function deriving the value of the control
 * @param compareValueProvider: function deriving the min value
 * @param options: {checkEqual: true} enables checking for equal, {checkAbove: true} for above and {checkBelow: true] for below.
 */
// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function valueRelation(
    controlValueProvider: (control: AbstractControl) => number,
    compareValueProvider: (control: AbstractControl) => number,
    options: {
        checkEqual?: boolean;
        checkAbove?: boolean;
        checkBelow?: boolean;
    } = {
        checkEqual: true,
        checkAbove: true,
        checkBelow: true,
    },
): (_: AbstractControl) => ValidationErrors | null {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = controlValueProvider(control);
        const compareValue = compareValueProvider(control);

        const errors: {
            valueAbove?: boolean;
            valueAboveOrEqual?: boolean;
            valueBelow?: boolean;
            valueBelowOrEqual?: boolean;
            valueEquals?: boolean;
            noFilter?: boolean;
        } = {};

        if (options.checkEqual && !nullOrUndefined(value) && !nullOrUndefined(compareValue) && value === compareValue) {
            errors.valueEquals = true;
            if (options.checkBelow) {
                errors.valueBelowOrEqual = true;
            }
            if (options.checkAbove) {
                errors.valueAboveOrEqual = true;
            }
        }

        if (options.checkBelow && !nullOrUndefined(value) && !nullOrUndefined(compareValue) && value < compareValue) {
            errors.valueBelow = true;
            errors.valueBelowOrEqual = true;
        }
        if (options.checkAbove && !nullOrUndefined(value) && !nullOrUndefined(compareValue) && value > compareValue) {
            errors.valueAbove = true;
            errors.valueAboveOrEqual = true;
        }
        if (nullOrUndefined(value)) {
            errors.noFilter = true;
        }
        return Object.keys(errors).length > 0 ? errors : null;
    };
}

export const isValidUuid = Validators.pattern(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
