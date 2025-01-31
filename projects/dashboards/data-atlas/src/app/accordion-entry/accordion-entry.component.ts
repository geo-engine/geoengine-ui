import {Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef} from '@angular/core';
import {mergeMap, BehaviorSubject, combineLatest, of, forkJoin, Observable, map, from} from 'rxjs';
import {LayerCollectionListingDict, ProjectService, ProviderLayerCollectionIdDict} from '@geoengine/core';
import {DataRange, DataSelectionService} from '../data-selection.service';
import {LayersService, RasterLayer, RasterSymbology, Time} from '@geoengine/common';
import {CollectionItem, LayerCollection, LayerListing, ProviderLayerId} from '@geoengine/openapi-client';

@Component({
    selector: 'geoengine-accordion-entry',
    templateUrl: './accordion-entry.component.html',
    styleUrls: ['./accordion-entry.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class AccordionEntryComponent implements OnInit {
    @Input() collection!: ProviderLayerCollectionIdDict;
    @Input() otherCollection?: ProviderLayerCollectionIdDict;
    @Input() icon = 'class';

    readonly selectedLayers$ = new BehaviorSubject<Array<ProviderLayerId | undefined>>([]);
    readonly collections$ = new BehaviorSubject<Array<LayerCollection>>([]);

    constructor(
        private readonly layersService: LayersService,
        readonly projectService: ProjectService,
        readonly dataSelectionService: DataSelectionService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        let otherCollectionItems$: Observable<Array<CollectionItem>> = of([]);
        if (this.otherCollection) {
            otherCollectionItems$ = from(
                this.layersService.getLayerCollectionItems(this.otherCollection.providerId, this.otherCollection.collectionId),
            ).pipe(map((c) => c.items));
        }

        forkJoin({
            providerCollections: this.layersService.getLayerCollectionItems(this.collection.providerId, this.collection.collectionId),
            otherCollectionItems: otherCollectionItems$,
        }).subscribe(({providerCollections, otherCollectionItems}) => {
            const collections = [];

            for (const item of providerCollections.items) {
                if (item.type === 'collection') {
                    const collection = item as LayerCollectionListingDict;
                    collections.push(this.layersService.getLayerCollectionItems(collection.id.providerId, collection.id.collectionId));
                }
            }

            for (const item of otherCollectionItems) {
                if (item.type === 'collection') {
                    const collection = item as LayerCollectionListingDict;
                    collections.push(this.layersService.getLayerCollectionItems(collection.id.providerId, collection.id.collectionId));
                }
            }

            combineLatest(collections).subscribe((col) => {
                col.sort((a, b) => a.name.localeCompare(b.name));

                this.collections$.next(col);
                this.selectedLayers$.next(new Array(col.length).fill(undefined));
            });
        });
    }

    layerSelected(i: number, layer: LayerListing | undefined): void {
        const selected = this.selectedLayers$.getValue();
        selected[i] = layer?.id;
        this.selectedLayers$.next(selected);
    }

    loadData(i: number): void {
        const id = this.selectedLayers$.getValue()[i];
        if (!id) {
            return;
        }

        from(this.layersService.getLayer(id.providerId, id.layerId))
            .pipe(
                mergeMap((layer) => combineLatest([of(layer), this.projectService.registerWorkflow(layer.workflow)])),
                mergeMap(([layer, workflowId]) => {
                    if (!layer.symbology) {
                        throw new Error('Layer has no symbology');
                    }

                    if (!layer.metadata) {
                        throw new Error('Layer has no metadata');
                    }

                    if (!('timeSteps' in layer.metadata)) {
                        throw new Error('Layer has no timeSteps');
                    }

                    if (!('dataRange' in layer.metadata)) {
                        throw new Error('Layer has no dataRange');
                    }

                    const timeSteps: Array<Time> = JSON.parse(layer.metadata['timeSteps']).map((t: number) => new Time(t));

                    const range: [number, number] = JSON.parse(layer.metadata['dataRange']);
                    const dataRange: DataRange = {
                        min: range[0],
                        max: range[1],
                    };

                    const rasterLayer = new RasterLayer({
                        name: 'EBV',
                        workflowId,
                        isVisible: true,
                        isLegendVisible: false,
                        symbology: RasterSymbology.fromDict(layer.symbology) as RasterSymbology,
                    });

                    return this.dataSelectionService.setRasterLayer(rasterLayer, timeSteps, dataRange);
                }),
            )
            .subscribe(() => this.changeDetectorRef.markForCheck());
    }
}
