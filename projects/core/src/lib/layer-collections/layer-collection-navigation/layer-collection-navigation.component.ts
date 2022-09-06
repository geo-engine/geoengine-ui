import {ComponentPortal, Portal} from '@angular/cdk/portal';
import {Component, ChangeDetectionStrategy, Injector} from '@angular/core';
import {LayerCollectionItemDict} from '../../backend/backend.model';
import {CONTEXT_TOKEN, LayerCollectionListComponent} from '../layer-collection-list/layer-collection-list.component';

@Component({
    selector: 'geoengine-layer-collection-navigation',
    templateUrl: './layer-collection-navigation.component.html',
    styleUrls: ['./layer-collection-navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionNavigationComponent {
    collections: Array<LayerCollectionItemDict | undefined> = [undefined];

    selectedCollection = 0;

    selectedPortal!: Portal<any>;

    constructor() {
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

    private setPortal(id?: LayerCollectionItemDict): void {
        this.selectedPortal = new ComponentPortal(LayerCollectionListComponent, null, this.createInjector(id));
    }

    private createInjector(id?: LayerCollectionItemDict): Injector {
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
