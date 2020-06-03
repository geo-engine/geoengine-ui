import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs';
import {map} from 'rxjs/operators';
import {Injectable, EventEmitter, ElementRef, QueryList} from '@angular/core';
import {SidenavConfig} from '../layout.service';

/**
 * This service provides means to interact with the sidenav container component.
 */
@Injectable()
export class SidenavRef {

    private title$ = new BehaviorSubject<string>(undefined);
    private backButtonComponent$ = new BehaviorSubject<SidenavConfig>(undefined);

    private searchElements$ = new BehaviorSubject<Array<ElementRef>>(undefined);
    private searchElementsSubscription: Subscription;
    private searchString$: EventEmitter<string>;

    private close$ = new Subject<void>();

    constructor() {
    }

    /**
     * Set the toolbar title
     */
    setTitle(title: string) {
        this.title$.next(title);
    }

    /**
     * Get events of title changes
     */
    getTitleStream(): Observable<string> {
        return this.title$;
    }

    /**
     * Set the component that should be loaded upon clicking "back"
     */
    setBackButtonComponent(component: SidenavConfig) {
        this.backButtonComponent$.next(component);
    }

    /**
     * Get events upon back button component changes
     */
    getBackButtonComponentStream(): Observable<SidenavConfig> {
        return this.backButtonComponent$;
    }

    /**
     * Retrieve the current back button component
     */
    getBackButtonComponent(): SidenavConfig {
        return this.backButtonComponent$.getValue();
    }

    /**
     * Setup the search via the `SidenavSearchComponent`
     *
     * @param contentChildren provides a reference to a `QueryList`
     * @param searchString$ this emits search inputs to upon changes to the query list
     */
    setSearch(contentChildren: QueryList<ElementRef>, searchString$: EventEmitter<string>) {
        this.removeSearch();

        this.searchElements$.next(contentChildren.toArray());
        this.searchElementsSubscription = contentChildren.changes.subscribe(elements => this.searchElements$.next(elements));
        this.searchString$ = searchString$;
    }

    /**
     * Unset the search setup
     */
    removeSearch() {
        if (this.searchElementsSubscription) {
            this.searchElementsSubscription.unsubscribe();
        }
        if (this.searchString$) {
            this.searchString$ = undefined;
        }

        this.searchElements$.next(undefined);
    }

    /**
     * Retrieve the current `SidenavSearchComponent` as a stream
     */
    getSearchComponentStream(): Observable<Array<ElementRef>> {
        return this.searchElements$;
    }

    /**
     * Retrieve the existence of a `SidenavSearchComponent` as a stream of indicators
     */
    hasSearchComponentStream(): Observable<boolean> {
        return this.searchElements$.pipe(map(elements => elements !== undefined));
    }

    /**
     * Function that safely emits the search term via `searchString$` if it is specified
     */
    searchTerm(term: string) {
        if (this.searchString$) {
            this.searchString$.next(term);
        }
    }

    /**
     * Close the sidenav
     */
    close() {
        this.close$.next();
    }

    /**
     * Get a stream to react on sidenav close actions.
     */
    getCloseStream() {
        return this.close$;
    }

}
