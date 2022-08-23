import {Injectable} from '@angular/core';
import {LayerCollectionItemDict, ProviderLayerCollectionIdDict} from '../../backend/backend.model';
import {LayerCollectionListComponent} from '../layer-collection-list/layer-collection-list.component';
import {LayerCollectionNavigationComponent} from '../layer-collection-navigation/layer-collection-navigation.component';

@Injectable({
    providedIn: 'root',
})
export class LayerCollectionBreadcrumbsService {
    private navigationComp: LayerCollectionNavigationComponent | null = null;
    private listComp: LayerCollectionListComponent | null = null;

    private history: Array<Array<ProviderLayerCollectionIdDict | LayerCollectionItemDict>> = [];

    constructor() {}

    registerNavigation(comp: LayerCollectionNavigationComponent): void {
        this.navigationComp = comp;
    }

    registerList(comp: LayerCollectionListComponent): void {
        this.listComp = comp;
    }
}
