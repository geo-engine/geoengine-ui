import {FormControl} from '@angular/forms';
import {isValidUuid} from './form.validators';

describe('Form Validators', () => {
    it('validates uuids', () => {
        expect(isValidUuid(new FormControl('504ed8a4-e0a4-5cef-9f91-b2ffd4a2b56b'))).toBeNull();
        expect(isValidUuid(new FormControl('foo'))).toEqual({
            pattern: {
                requiredPattern: '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
                actualValue: 'foo',
            },
        });
    });
});
