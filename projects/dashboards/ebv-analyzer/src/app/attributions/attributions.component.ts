import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';
import {Component, ChangeDetectionStrategy, HostBinding} from '@angular/core';
import {Observable, map} from 'rxjs';

@Component({
    selector: 'geoengine-ebv-attributions',
    templateUrl: './attributions.component.html',
    styleUrls: ['./attributions.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class AttributionsComponent {
    @HostBinding('className') componentClass = 'mat-typography';

    colSpan: Observable<number>;
    rowHeight: Observable<string>;

    constructor(protected breakpointObserver: BreakpointObserver) {
        this.colSpan = this.breakpointObserver.observe(Breakpoints.XLarge).pipe(
            map(({matches}) => {
                return matches ? 1 : 2;
            }),
        );
        this.rowHeight = this.colSpan.pipe(
            map((span) => {
                return span == 1 ? '1:1' : '1:2';
            }),
        );
    }
}
