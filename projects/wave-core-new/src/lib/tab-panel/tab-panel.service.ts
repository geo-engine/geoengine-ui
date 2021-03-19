import {ComponentType} from '@angular/cdk/portal';
import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

/**
 * A component to display inside a tab
 */
export interface TabContent {
    name: string;
    component: ComponentType<any>;
    inputs: TabInputs;
}

export interface TabInputs {
    [property: string]: any;
}

@Injectable({
    providedIn: 'root',
})
export class TabPanelService {
    protected readonly _tabs = new BehaviorSubject<Array<TabContent>>([]);

    constructor() {}

    get tabs(): Observable<Array<TabContent>> {
        return this._tabs;
    }

    /**
     * Add a new component to the tab panel
     */
    addComponent<T>(name: string, component: ComponentType<T>, inputs: TabInputs = {}): void {
        const tab = {name, component, inputs};
        const tabs = [...this._tabs.getValue(), tab];
        this._tabs.next(tabs);
    }

    /**
     * Remove the component at index `index` from the tab panel
     */
    removeComponent(index: number): void {
        const oldTabs = this._tabs.getValue();
        const tabs = [...oldTabs.slice(0, index), ...oldTabs.slice(index + 1, oldTabs.length)];
        this._tabs.next(tabs);
    }
}
