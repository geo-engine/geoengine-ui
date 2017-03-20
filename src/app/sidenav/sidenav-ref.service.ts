import {Injectable, Component, Type, EventEmitter, ElementRef, QueryList} from '@angular/core';
import {BehaviorSubject, Observable, Subject, Subscription} from 'rxjs/Rx';


@Injectable()
export class SidenavRef {

    private title$ = new BehaviorSubject<string>(undefined);
    private backButtonComponent$ = new BehaviorSubject<Type<Component>>(undefined);

    private searchElements$ = new BehaviorSubject<Array<ElementRef>>(undefined);
    private searchElementsSubscription: Subscription;
    private searchString$: EventEmitter<string>;

    private close$ = new Subject<void>();

    constructor() {
    }

    setTitle(title: string) {
        this.title$.next(title);
    }

    getTitleStream(): Observable<string> {
        return this.title$;
    }

    setBackButtonComponent(component: Type<Component>) {
        this.backButtonComponent$.next(component);
    }

    getBackButtonComponentStream(): Observable<Type<Component>> {
        return this.backButtonComponent$;
    }

    getBackButtonComponent(): Type<Component> {
        return this.backButtonComponent$.getValue();
    }

    setSearch(contentChildren: QueryList<ElementRef>, searchString$: EventEmitter<string>) {
        this.removeSearch();

        this.searchElements$.next(contentChildren.toArray());
        this.searchElementsSubscription = contentChildren.changes.subscribe(elements => this.searchElements$.next(elements));
        this.searchString$ = searchString$;
    }

    removeSearch() {
        if (this.searchElementsSubscription) {
            this.searchElementsSubscription.unsubscribe();
        }
        if (this.searchString$) {
            this.searchString$ = undefined;
        }

        this.searchElements$.next(undefined);
    }

    getSearchComponentStream(): Observable<Array<ElementRef>> {
        return this.searchElements$;
    }

    hasSearchComponentStream(): Observable<boolean> {
        return this.searchElements$.map(elements => elements !== undefined);
    }

    searchTerm(term: string) {
        if (this.searchString$) {
            this.searchString$.next(term);
        }
    }

    close() {
        this.close$.next();
    }

    getCloseStream() {
        return this.close$;
    }

}
