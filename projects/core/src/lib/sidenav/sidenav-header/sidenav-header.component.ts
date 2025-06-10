import {Component, ChangeDetectionStrategy, ElementRef, AfterViewInit, AfterViewChecked} from '@angular/core';
import {SidenavRef} from '../sidenav-ref.service';

@Component({
    selector: 'geoengine-sidenav-header',
    templateUrl: './sidenav-header.component.html',
    styleUrls: ['./sidenav-header.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [],
})
export class SidenavHeaderComponent implements AfterViewInit, AfterViewChecked {
    constructor(
        private elementRef: ElementRef<HTMLElement>,
        private sidenavRef: SidenavRef,
    ) {}

    ngAfterViewInit(): void {
        this.sidenavRef.setTitle(this.elementRef.nativeElement.textContent ?? undefined);
    }

    ngAfterViewChecked(): void {
        this.sidenavRef.setTitle(this.elementRef.nativeElement.textContent ?? undefined);
    }
}
