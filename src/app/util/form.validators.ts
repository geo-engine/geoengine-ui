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
    return (control: AbstractControl): Observable<{[key: string]: boolean}> => {

        return Observable.create((observer: Observer<{[key: string]: boolean}>) => {
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

export const WaveValidators = {
    conditionalValidator: conditionalValidator,
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
 * This Validator checks if a value is greater (or equal) to the provided minimum.
 * @param controlValueProvider: function deriving the value of the control
 * @param minValueProvider: function deriving the min value
 * @param options: {checkEqual: true} enables checking for equal values
 */
export function valueAboveMin(
    controlValueProvider: (control: AbstractControl) => number,
    minValueProvider: (control: AbstractControl) => number,
    options?: {
        checkEqual?: boolean,
    }) {
    if (!options) {
        options = {};
    }

    return (control: AbstractControl): { [key: string]: boolean } => {
        const value = controlValueProvider(control);
        const min = minValueProvider(control);

        const errors: {
            valueBelowMin?: boolean,
            valueEqualsMin?: boolean,
            noFilter?: boolean,
        } = {};

        if (options.checkEqual && !nullOrUndefined(value) && !nullOrUndefined(min) && value === min) {
            errors.valueEqualsMin = true;
        }

        if (!nullOrUndefined(value) && !nullOrUndefined(min) && value < min) {
            errors.valueBelowMin = true;
        }
        if (nullOrUndefined(value)) {
            errors.noFilter = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };
}

/**
 * This Validator checks if a value is below (or equal) to the provided maximum.
 * @param controlValueProvider: function deriving the value of the control
 * @param maxValueProvider: function deriving the min value
 * @param options: {checkEqual: true} enables checking for equal values
 */
export function valueBelowMax(
    controlValueProvider: (control: AbstractControl) => number,
    maxValueProvider: (control: AbstractControl) => number,
    options?: {
        checkEqual?: boolean
    }) {
    if (!options) {
        options = {};
    }

    return (control: AbstractControl): { [key: string]: boolean } => {
        const value = controlValueProvider(control);
        const max = maxValueProvider(control);

        const errors: {
            valueAboveMax?: boolean,
            valueEqualsMax?: boolean,
            noFilter?: boolean,
        } = {};

        if (options.checkEqual && !nullOrUndefined(value) && !nullOrUndefined(max) && value === max) {
            errors.valueEqualsMax = true;
        }

        if (!nullOrUndefined(value) && !nullOrUndefined(max) && value > max) {
            errors.valueAboveMax = true;
        }
        if (nullOrUndefined(value)) {
            errors.noFilter = true;
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };
}
