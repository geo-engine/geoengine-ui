import {Subscription, combineLatest} from 'rxjs';
import {
    Component,
    OnInit,
    ChangeDetectionStrategy,
    ViewChild,
    ViewContainerRef,
    ComponentRef,
    ComponentFactoryResolver,
    OnDestroy,
    ElementRef,
    ViewChildren,
    QueryList,
    AfterViewInit,
    Renderer2
} from '@angular/core';
import {SidenavRef} from '../sidenav-ref.service';
import {LayoutService, SidenavConfig} from '../../layout.service';
import {map} from 'rxjs/operators';

/**
 * This is a container component that encapsulates sidenav components, dialogs, etc. and
 * provides common functionality, e.g. a search component and back buttons.
 *
 * The functionality can be triggered by using specific components,
 * e.g., `SidenavHeaderComponent` or `SidenavSearchComponent`.
 */
@Component({
    selector: 'wave-sidenav-container',
    templateUrl: './sidenav-container.component.html',
    styleUrls: ['./sidenav-container.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidenavContainerComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('target', {read: ViewContainerRef, static: true})
    target: ViewContainerRef;

    @ViewChildren('searchElements', {read: ViewContainerRef})
    searchElements: QueryList<ViewContainerRef>;

    searchTerm: string;

    componentRef: ComponentRef<any>;

    private currentSidenavConfig: SidenavConfig;

    private subscriptions: Array<Subscription> = [];

    /**
     * DI for services
     */
    constructor(private componentFactoryResolver: ComponentFactoryResolver,
                public sidenavRef: SidenavRef,
                public layoutService: LayoutService,
                private renderer: Renderer2) {
    }

    ngOnInit() {
        this.subscriptions.push(
            this.sidenavRef.getCloseStream().subscribe(() => this.close())
        );
    }

    ngAfterViewInit() {
        this.subscriptions.push(
            combineLatest([
                this.sidenavRef.getSearchComponentStream(),
                this.searchElements.changes,
            ]).pipe(
                map(([elements, searchElementsQuery]) => [elements, searchElementsQuery.first]),
            ).subscribe(([elements, searchElements]: [Array<ElementRef>, ViewContainerRef]) => {
                if (searchElements) {
                    searchElements.clear();
                }
                if (elements && searchElements) {
                    const parent = searchElements.element.nativeElement;
                    const nodes = elements.map(e => e.nativeElement);

                    for (const node of nodes) {
                        this.renderer.appendChild(parent, node);
                    }
                }
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.forEach(subscription => subscription.unsubscribe());
    }

    /**
     * Loads a component into the sidenav
     * and sets up functionality, for instance, the back button
     * and the search config
     */
    load(sidenavConfig: SidenavConfig) {
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
            const componentFactory = this.componentFactoryResolver.resolveComponentFactory(sidenavConfig.component);
            this.componentRef = this.target.createComponent(componentFactory);

            if (sidenavConfig.config) {
                for (const key in sidenavConfig.config) {
                    if (sidenavConfig.config.hasOwnProperty(key)) {
                        this.componentRef.instance[key] = sidenavConfig.config[key];
                    }
                }
            }

            setTimeout(() => this.componentRef.changeDetectorRef.markForCheck());
        }

        this.currentSidenavConfig = sidenavConfig;
    }

    /**
     * Close the sidenav
     */
    close() {
        this.layoutService.setSidenavContentComponent(undefined);
    }

    /**
     * Return (load) to the component specified in `backButtonComponent$` of each component config
     */
    back() {
        this.layoutService.setSidenavContentComponent(this.sidenavRef.getBackButtonComponent());
    }

}
