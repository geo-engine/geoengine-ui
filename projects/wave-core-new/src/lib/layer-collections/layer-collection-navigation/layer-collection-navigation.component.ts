import {ComponentPortal, Portal} from '@angular/cdk/portal';
import {Component, ChangeDetectionStrategy, Injector, Provider} from '@angular/core';
import {LayerCollectionItemDict, ProviderLayerCollectionIdDict} from '../../backend/backend.model';
import {CONTEXT_TOKEN, LayerCollectionListComponent} from '../layer-collection-list/layer-collection-list.component';
import {LayerCollectionBreadcrumbsService} from '../layer-collections-breadcrumb-service/layer-collection-breadcrumbs.service';

@Component({
    selector: 'wave-layer-collection-navigation',
    templateUrl: './layer-collection-navigation.component.html',
    styleUrls: ['./layer-collection-navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionNavigationComponent {
    collections: Array<LayerCollectionItemDict | undefined> = [undefined];

    selectedCollection = 0;

    selectedPortal!: Portal<any>;

    constructor(private readonly breadCrumbService: LayerCollectionBreadcrumbsService) {
        this.setPortal(undefined);
    }

    selectCollection(id: LayerCollectionItemDict): void {
        this.collections = this.collections.splice(0, this.selectedCollection + 1);
        this.collections.push(id);
        this.selectedCollection += 1;

        this.setPortal(id);
    }

    back(): void {
        if (this.selectedCollection > 0) {
            this.selectedCollection -= 1;
            const id = this.collections[this.selectedCollection];
            console.log(id);

            this.setPortal(id);
        }
    }

    forward(): void {
        if (this.selectedCollection < this.collections.length - 1) {
            this.selectedCollection += 1;
            const id = this.collections[this.selectedCollection];

            this.setPortal(id);
        }
    }

    navigateToRoot(): void {
        console.log('To root');
    }

    private setPortal(id?: LayerCollectionItemDict): void {
        const providerLayer = id?.id as ProviderLayerCollectionIdDict;
        this.selectedPortal = new ComponentPortal(LayerCollectionListComponent, null, this.createInjector(providerLayer));
    }

    private createInjector(id?: ProviderLayerCollectionIdDict): Injector {
        return Injector.create({
            providers: [
                {
                    provide: CONTEXT_TOKEN,
                    useValue: {id, selectListener: (selection: LayerCollectionItemDict) => this.selectCollection(selection)},
                },
            ],
        });
    }
}
