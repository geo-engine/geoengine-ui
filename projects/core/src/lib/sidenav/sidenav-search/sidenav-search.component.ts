import {
    Component,
    ChangeDetectionStrategy,
    ElementRef,
    ContentChildren,
    QueryList,
    AfterViewInit,
    Directive,
    inject,
    output,
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
    private sidenavRef = inject(SidenavRef);

    @ContentChildren(SidenavSearchRightDirective, {read: ElementRef}) contentChildren!: QueryList<ElementRef>;

    readonly searchString = output<string>();

    ngAfterViewInit(): void {
        this.sidenavRef.setSearch(this.contentChildren, this.searchString);
    }
}
