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
    collections: Array<LayerCollectionItemDict> = [];
    allTrails: Array<Array<LayerCollectionItemDict>> = [];
    displayedTrail: Array<LayerCollectionItemDict> = [];

    selectedCollection = 0;

    selectedPortal!: Portal<any>;

    constructor(private readonly breadCrumbService: LayerCollectionBreadcrumbsService) {
        this.setPortal(undefined);
    }

    selectCollection(id: LayerCollectionItemDict): void {
        this.collections = this.collections.splice(0, this.selectedCollection + 1);
        this.collections.push(id);
        this.selectedCollection += 1;

        // handle array of arrays
        let clone = this.collections.map((x) => Object.assign({}, x)); // ???
        this.allTrails = this.allTrails.slice(0, this.selectedCollection);
        this.allTrails.push(clone);
        this.displayedTrail = this.allTrails[this.selectedCollection];

        this.logAll();
        this.setPortal(id);
    }

    back(): void {
        if (this.selectedCollection > 0) {
            this.selectedCollection -= 1;
            // const id = this.collections[this.selectedCollection];

            // Getting the right id from all Trails
            const currentTrail = this.allTrails[this.selectedCollection];
            this.displayedTrail = currentTrail;
            const lastId = currentTrail[currentTrail.length - 1];

            this.logAll();
            this.setPortal(lastId);
        }
    }

    forward(): void {
        if (this.selectedCollection < this.allTrails.length - 1) {
            this.selectedCollection += 1;
            // const id = this.collections[this.selectedCollection];

            // Getting the right id from all Trails
            const currentTrail = this.allTrails[this.selectedCollection];
            this.displayedTrail = currentTrail;
            const lastId = currentTrail[currentTrail.length - 1];

            this.logAll();
            this.setPortal(lastId);
        }
    }

    onBreadCrumbClick(index: number) {
        console.log(index);
        const newTrail = this.allTrails[index].map((x) => Object.assign({}, x));
        this.allTrails.push(newTrail);
        this.logAll();
        this.forward();

        // this.selectedCollection = index;
        // const currentTrail = this.allTrails[this.selectedCollection];
        // this.displayedTrail = currentTrail;
        // const lastId = currentTrail[currentTrail.length - 1];
        // this.setPortal(lastId);
    }

    logAll(): void {
        console.log('Now selected collection:' + this.selectedCollection);
        console.log('All trails:');
        console.log(this.allTrails);
        console.log('collections (old):');
        console.log(this.collections);
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
