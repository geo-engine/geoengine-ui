import {Component, Input, ChangeDetectionStrategy} from '@angular/core';

@Component({
    selector: 'wave-dialog-section-heading',
    templateUrl: './dialog-section-heading.component.html',
    styleUrls: ['./dialog-section-heading.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogSectionHeadingComponent {
    @Input('title') title: string;
    @Input('subtitle') subtitle: string;
}
