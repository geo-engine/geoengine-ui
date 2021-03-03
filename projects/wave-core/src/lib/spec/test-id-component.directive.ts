import {Directive, Input} from '@angular/core';

@Directive({
    selector: '[waveTestId]',
})
export class TestIdComponentDirective {
    @Input('waveTestId') test_id: string;
}
