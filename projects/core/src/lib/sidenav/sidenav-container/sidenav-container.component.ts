import {Subscription, combineLatest, Observable} from 'rxjs';
import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewChild,
    ViewContainerRef,
    ComponentRef,
    OnDestroy,
    ElementRef,
    ViewChildren,
    QueryList,
    AfterViewInit,
    Renderer2,
    Injector,
    SkipSelf,
} from '@angular/core';
import {SidenavRef} from '../sidenav-ref.service';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {map} from 'rxjs/operators';
import {MatSidenav} from '@angular/material/sidenav';

/**
 * This is a container component that encapsulates sidenav components, dialogs, etc. and
 * provides common functionality, e.g. a search component and back buttons.
 *
 * The functionality can be triggered by using specific components,
 * e.g., `SidenavHeaderComponent` or `SidenavSearchComponent`.
 */
@Component({
    selector: 'geoengine-sidenav-container',
    templateUrl: './sidenav-container.component.html',
    styleUrls: ['./sidenav-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidenavContainerComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('target', {read: ViewContainerRef, static: true})
    target!: ViewContainerRef;

    @ViewChildren('searchElements', {read: ViewContainerRef})
    searchElements!: QueryList<ViewContainerRef>;

    searchTerm = '';

    componentRef?: ComponentRef<any>;

    sidenavPosition: 'start' | 'end';

    private currentSidenavConfig?: SidenavConfig;

    private subscriptions: Array<Subscription> = [];

    /**
     * DI for services
     */
    constructor(
        public readonly sidenavRef: SidenavRef,
        public readonly layoutService: LayoutService,
        private readonly renderer: Renderer2,
        @SkipSelf() parentInjector: Injector,
    ) {
        const sidenav: MatSidenav = parentInjector.get<MatSidenav>(MatSidenav);

        this.sidenavPosition = sidenav.position;
    }

    ngOnInit(): void {
        this.subscriptions.push(this.sidenavRef.getCloseStream().subscribe(() => this.close()));
    }

    ngAfterViewInit(): void {
        this.subscriptions.push(
            combineLatest([
                this.sidenavRef.getSearchComponentStream(),
                this.searchElements.changes as Observable<QueryList<ViewContainerRef>>,
            ])
                .pipe(
                    map(([elements, searchElementsQuery]): [Array<ElementRef> | undefined, ViewContainerRef] => [
                        elements,
                        searchElementsQuery.first,
                    ]),
                )
                .subscribe(([elements, searchElements]: [Array<ElementRef> | undefined, ViewContainerRef]) => {
                    if (searchElements) {
                        searchElements.clear();
                    }
                    if (elements && searchElements) {
                        const parent = searchElements.element.nativeElement;
                        const nodes = elements.map((e) => e.nativeElement);

                        for (const node of nodes) {
                            this.renderer.appendChild(parent, node);
                        }
                    }
                }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }

    /**
     * Loads a component into the sidenav
     * and sets up functionality, for instance, the back button
     * and the search config
     */
    load(sidenavConfig?: SidenavConfig): void {
        if (this.componentRef) {
            this.target.clear();
            this.componentRef.destroy();
        }

        this.sidenavRef.setTitle(undefined);

        if (!sidenavConfig) {
            this.sidenavRef.setBackButtonComponent(undefined);
        } else if (sidenavConfig.parent) {
            this.sidenavRef.setBackButtonComponent(sidenavConfig.parent);
        } else if (sidenavConfig.keepParent) {
            this.sidenavRef.setBackButtonComponent(this.currentSidenavConfig);
        } else {
            this.sidenavRef.setBackButtonComponent(undefined);
        }

        this.sidenavRef.removeSearch();
        this.searchTerm = '';

        if (this.componentRef) {
            this.target.clear();
            this.componentRef.destroy();
        }
        if (this.target && sidenavConfig && sidenavConfig.component) {
            this.componentRef = this.target.createComponent(sidenavConfig.component);

            if (sidenavConfig.config) {
                for (const key in sidenavConfig.config) {
                    if (sidenavConfig.config.hasOwnProperty(key)) {
                        this.componentRef.instance[key] = sidenavConfig.config[key];
                    }
                }
            }

            setTimeout(() => this.componentRef?.changeDetectorRef.markForCheck());
        }

        this.currentSidenavConfig = sidenavConfig;
    }

    /**
     * Close the sidenav
     */
    close(): void {
        this.layoutService.setSidenavContentComponent(undefined);
    }

    /**
     * Return (load) to the component specified in `backButtonComponent$` of each component config
     */
    back(): void {
        this.layoutService.setSidenavContentComponent(this.sidenavRef.getBackButtonComponent());
    }
}
