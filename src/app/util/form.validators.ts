import {Observable, Observer} from 'rxjs';
import {map} from 'rxjs/operators';
import {AbstractControl, AsyncValidatorFn} from '@angular/forms';
import {StorageService} from '../storage/storage.service';

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
    if (typeof options.checkBothExist !== 'boolean') { // default
        options.checkBothExist = false;
    }
    if (typeof options.checkOneExists !== 'boolean') { // default
        options.checkOneExists = true;
    }

    return (control: AbstractControl): { [key: string]: boolean } => {
        const min = control.get(controlMinName).value;
        const max = control.get(controlMaxName).value;

        const errors: {
            minOverMax?: boolean,
            noFilter?: boolean,
            noFiniteNumber?: boolean,
        } = {};

        const validMin = isFiniteNumber(min);
        const validMax = isFiniteNumber(max);

        if (validMin && validMax && max < min) {
            errors.minOverMax = true;
        }

        if (options.checkOneExists && (!validMin && !validMax)) {
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
}

/**
 * A validator that invokes the underlying one only if the condition holds.
 * @param validator
 * @param condition
 * @returns {(control:AbstractControl)=>{[p: string]: boolean}}
 */
function conditionalValidator(validator: (control: AbstractControl) => { [key: string]: boolean },
                              condition: () => boolean) {
    return (control: AbstractControl): { [key: string]: boolean } => {
        if (condition()) {
            return validator(control);
        } else {
            return null;
        }
    };
}

/**
 * Checks if keyword is a reserved keyword.
 * @param keywords
 * @returns {(control:AbstractControl)=>{keyword: boolean}}
 */
function keywordValidator(keywords: Array<string>) {
    return (control: AbstractControl) => {
        return keywords.indexOf(control.value) >= 0 ? {'keyword': true} : null;
    };
}

/**
 * Checks if the project name is unique.
 * @param storageService
 * @returns {(control:AbstractControl)=>Observable<{[p: string]: boolean}>}
 */
function uniqueProjectNameValidator(storageService: StorageService): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{ [key: string]: boolean }> => {

        return Observable.create((observer: Observer<{ [key: string]: boolean }>) => {
            storageService.projectExists(control.value as string).pipe(
                map(projectExists => {
                    const errors: {
                        nameInUsage?: boolean,
                    } = {};

                    if (projectExists) {
                        errors.nameInUsage = true;
                    }

                    return Object.keys(errors).length > 0 ? errors : null;
                }))
                .subscribe(errors => {
                    observer.next(errors);
                    observer.complete();
                }, error => {
                    observer.error(error);
                });
        });

    };
}

function notOnlyWhitespace(control: AbstractControl) {
    const text = control.value as string;
    if (!text) {
        return null;
    }
    return text.trim().length <= 0 ? {'onlyWhitespace': true} : null;
}

function isNumber(control: AbstractControl) {
    const value = control.value;
    return isFiniteNumber(value) ? null : {isNoNumber: true};
}

function isFiniteNumber(value: any): boolean {
    return value !== null && value !== undefined && !isNaN(value) && isFinite(value);
}

export const WaveValidators = {
    conditionalValidator: conditionalValidator,
    isNumber: isNumber,
    keyword: keywordValidator,
    minAndMax: minAndMax,
    notOnlyWhitespace: notOnlyWhitespace,
    uniqueProjectName: uniqueProjectNameValidator,
};

/**
 * checks if a value is undefined or null
 * @param value
 */
function nullOrUndefined(value: any) {
    return value === undefined || value === null;
}

/**
 * This Validator checks the relation of a value compared to another value.
 * @param controlValueProvider: function deriving the value of the control
 * @param compareValueProvider: function deriving the min value
 * @param options: {checkEqual: true} enables checking for equal, {checkAbove: true} for above and {checkBelow: true] for below.
 */
export function valueRelation(
    controlValueProvider: (control: AbstractControl) => number,
    compareValueProvider: (control: AbstractControl) => number,
    options?: {
        checkEqual?: boolean,
        checkAbove?: boolean,
        checkBelow?: boolean,
    }) {
    if (!options) {
        options = {
            checkEqual: true,
            checkAbove: true,
            checkBelow: true,
        };
    }

    return (control: AbstractControl): { [key: string]: boolean } => {
        const value = controlValueProvider(control);
        const compareValue = compareValueProvider(control);

        const errors: {
            valueAbove?: boolean,
            valueAboveOrEqual?: boolean,
            valueBelow?: boolean,
            valueBelowOrEqual?: boolean,
            valueEquals?: boolean,
            noFilter?: boolean,
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
