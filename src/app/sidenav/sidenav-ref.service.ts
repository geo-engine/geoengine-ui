import {Injectable, Component, Type} from '@angular/core';
import {BehaviorSubject, Observable, Subject} from 'rxjs/Rx';


@Injectable()
export class SidenavRef {

    private title$ = new BehaviorSubject<string>(undefined);
    private backButtonComponent$ = new BehaviorSubject<Type<Component>>(undefined);

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

    close() {
        this.close$.next();
    }

    getCloseStream() {
        return this.close$;
    }

}
