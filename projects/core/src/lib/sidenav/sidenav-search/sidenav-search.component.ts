import {
    Component,
    ChangeDetectionStrategy,
    ElementRef,
    ContentChildren,
    QueryList,
    Output,
    EventEmitter,
    AfterViewInit,
    Directive,
} from '@angular/core';
import {SidenavRef} from '../sidenav-ref.service';

@Directive({selector: '[geoengineSidenavSearchRight]'})
export class SidenavSearchRightDirective {}

@Component({
    selector: 'geoengine-sidenav-search',
    templateUrl: './sidenav-search.component.html',
    styleUrls: ['./sidenav-search.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavSearchComponent implements AfterViewInit {
    @ContentChildren(SidenavSearchRightDirective, {read: ElementRef}) contentChildren!: QueryList<ElementRef>;

    @Output() searchString = new EventEmitter<string>();

    constructor(private sidenavRef: SidenavRef) {}

    ngAfterViewInit(): void {
        this.sidenavRef.setSearch(this.contentChildren, this.searchString);
    }
}
