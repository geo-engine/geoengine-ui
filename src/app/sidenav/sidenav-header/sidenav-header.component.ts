import {Component, OnInit, ChangeDetectionStrategy, ElementRef, AfterViewInit,} from '@angular/core';
import {SidenavRef} from '../sidenav-ref.service';

@Component({
    selector: 'wave-sidenav-header',
    templateUrl: './sidenav-header.component.html',
    styleUrls: ['./sidenav-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavHeaderComponent implements AfterViewInit {

    constructor(private elementRef: ElementRef,
                private sidenavRef: SidenavRef) {
    }

    ngAfterViewInit() {
        this.sidenavRef.setTitle(this.elementRef.nativeElement.textContent);
    }

}
