import {NgModule} from '@angular/core';
import {CommonModule as AngularCommonModule} from '@angular/common';
import {CommonComponent} from './common/common.component';

@NgModule({
    declarations: [CommonComponent],
    imports: [AngularCommonModule],
    exports: [CommonComponent],
})
export class CommonModule {}
