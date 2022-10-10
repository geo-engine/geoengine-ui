import {ComponentPortal, Portal} from '@angular/cdk/portal';
import {Component, ViewChild, ElementRef, ChangeDetectionStrategy, Injector, Input, OnInit} from '@angular/core';
import {LayerCollectionItemDict, ProviderLayerCollectionIdDict} from '../../backend/backend.model';
import {CONTEXT_TOKEN, LayerCollectionListComponent} from '../layer-collection-list/layer-collection-list.component';

@Component({
    selector: 'geoengine-layer-collection-navigation',
    templateUrl: './layer-collection-navigation.component.html',
    styleUrls: ['./layer-collection-navigation.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionNavigationComponent implements OnInit {
    @Input() rootCollectionItem?: LayerCollectionItemDict;

    collections: Array<LayerCollectionItemDict> = [];
    allTrails: Array<Array<LayerCollectionItemDict>> = [];
    displayedTrail: Array<LayerCollectionItemDict> = [];

    selectedCollection = -1;

    selectedPortal!: Portal<any>;

    @ViewChild('scrollElement', {read: ElementRef}) public scrollElement!: ElementRef<any>;

    constructor() {}

    ngOnInit(): void {
        this.setPortal(undefined);
    }

    scrollToRight(): void {
        setTimeout(() => {
            // wait until breadcrumbs are re-rendered before scrolling
            this.scrollElement.nativeElement.scrollLeft += this.scrollElement.nativeElement.scrollWidth;
        }, 0);
    }

    selectCollection(id: LayerCollectionItemDict): void {
        this.collections = this.collections.splice(0, this.displayedTrail.length);
        this.collections.push(id);
        this.selectedCollection += 1;

        // Create a new trail, append it to the collection and display it
        const clone = this.collections.map((x) => Object.assign({}, x));
        this.allTrails = this.allTrails.slice(0, this.selectedCollection);
        this.allTrails.push(clone);
        this.displayedTrail = this.allTrails[this.selectedCollection];

        this.scrollToRight();

        this.setPortal(id);
    }

    back(): void {
        if (this.selectedCollection > 0) {
            this.selectedCollection -= 1;
            this.updateLayerView();
        } else if (this.selectedCollection === 0) {
            this.displayedTrail = [];
            this.showRoot();
            this.selectedCollection = -1;
        }
    }

    forward(): void {
        if (this.selectedCollection < this.allTrails.length - 1) {
            this.selectedCollection += 1;
            this.updateLayerView();
            this.scrollToRight();
        }
    }

    updateLayerView(): void {
        const currentTrail = this.allTrails[this.selectedCollection];
        this.displayedTrail = currentTrail;
        const lastId = currentTrail[currentTrail.length - 1];
        this.setPortal(lastId);
    }

    onBreadCrumbClick(index: number): void {
        // Creates and appends a new crumbtrail, then moves forward to it
        if (index === this.displayedTrail.length - 1) {
            return;
        }
        const newTrail = this.displayedTrail.map((x) => Object.assign({}, x)).slice(0, index + 1);
        this.allTrails.push(newTrail);
        this.selectedCollection = this.allTrails.length - 2;
        this.forward();
    }

    navigateToRoot(): void {
        if (this.selectedCollection === -1) {
            return;
        }
        const newTrail: Array<LayerCollectionItemDict> = [];
        this.allTrails.push(newTrail);
        this.selectedCollection = this.allTrails.length - 2;
        this.forward();
    }

    showRoot(): void {
        this.setPortal(undefined);
    }

    private setPortal(id?: LayerCollectionItemDict): void {
        if (!id) {
            id = this.rootCollectionItem;
        }

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
