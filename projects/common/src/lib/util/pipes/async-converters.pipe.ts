import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
    name: 'stringSanitizer',
    standalone: false,
})
export class AsyncStringSanitizer implements PipeTransform {
    transform(value: string | undefined | null, defaultValue = ''): string {
        if (value === undefined || value === null) {
            return defaultValue;
        }

        return value;
    }
}

@Pipe({
    name: 'numberSanitizer',
    standalone: false,
})
export class AsyncNumberSanitizer implements PipeTransform {
    transform(value: number | undefined | null, defaultValue = 0): number {
        if (value === undefined || value === null) {
            return defaultValue;
        }

        return value;
    }
}

@Pipe({
    name: 'valueDefault',
    standalone: false,
})
export class AsyncValueDefault implements PipeTransform {
    transform<T>(value: T | undefined | null, defaultValue: T): T {
        if (value === undefined || value === null) {
            return defaultValue;
        }

        return value;
    }
}
