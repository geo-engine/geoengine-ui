import {Directive, Input} from '@angular/core';

@Directive({
    selector: '[wave-test-id]'
})
export class TestIdComponentDirective {

    @Input('wave-test-id') test_id: string;

}
