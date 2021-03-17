import {ComponentPortal} from '@angular/cdk/portal';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable, of} from 'rxjs';

/**
 * A component to display inside a tab
 */
export interface TabContent {
    name: string;
    component: ComponentPortal<any>;
}

@Injectable({
    providedIn: 'root',
})
export class TabPanelService {
    protected readonly _tabs = new BehaviorSubject<Array<TabContent>>([]);
    protected readonly _collapsed = new BehaviorSubject<boolean>(true);

    constructor() {}

    get tabs(): Observable<Array<TabContent>> {
        return this._tabs;
    }

    get collapsed(): Observable<boolean> {
        return this._collapsed;
    }

    get height(): Observable<number> {
        return of(100); // TODO: get from layout service
    }

    /**
     * Add a new component to the tab panel
     */
    addComponent<T>(name: string, component: ComponentPortal<T>): void {
        const tabs = this._tabs.getValue();
        tabs.push({name, component});
        this._tabs.next(tabs);

        // TODO: select it?
    }

    /**
     * Remove the component at index `index` from the tab panel
     */
    removeComponent(index: number): void {
        const tabs = this._tabs.getValue();
        delete tabs[index];
        this._tabs.next(tabs);
    }

    /**
     * Expand the tab panel if it is `collapsed`
     */
    expand(): void {
        if (this._collapsed.getValue()) {
            this._collapsed.next(false);
        }
    }
}
