import {AbstractControl, AsyncValidatorFn} from '@angular/forms';
import {StorageService} from '../storage/storage.service';
import {Observable, Observer} from 'rxjs/Rx';

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
            storageService.projectExists(control.value as string)
                .map(projectExists => {
                    const errors: {
                        nameInUsage?: boolean,
                    } = {};

                    if (projectExists) {
                        errors.nameInUsage = true;
                    }

                    return Object.keys(errors).length > 0 ? errors : null;
                })
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
    return text.trim().length <= 0 ? {'onlyWhitespace': true} : null;
}

export const WaveValidators = {
    conditionalValidator: conditionalValidator,
    keyword: keywordValidator,
    minAndMax: minAndMax,
    notOnlyWhitespace: notOnlyWhitespace,
    uniqueProjectName: uniqueProjectNameValidator,
};
