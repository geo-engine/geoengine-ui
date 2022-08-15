import {Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef} from '@angular/core';
import {mergeMap, BehaviorSubject, combineLatest, of} from 'rxjs';
import {
    LayerCollectionDict,
    LayerCollectionService,
    ProjectService,
    ProviderLayerCollectionIdDict,
    ProviderLayerIdDict,
    RasterLayer,
    RasterSymbology,
    Time,
} from 'wave-core';
import {DataRange, DataSelectionService} from '../data-selection.service';

@Component({
    selector: 'wave-accordion-entry',
    templateUrl: './accordion-entry.component.html',
    styleUrls: ['./accordion-entry.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionEntryComponent implements OnInit {
    @Input() collection!: ProviderLayerCollectionIdDict;
    @Input() icon = 'class';

    readonly selectedLayers$ = new BehaviorSubject<Array<ProviderLayerIdDict | undefined>>([]);
    readonly datasets$ = new BehaviorSubject<Array<LayerCollectionDict>>([]);

    constructor(
        private readonly layerCollectionService: LayerCollectionService,
        readonly projectService: ProjectService,
        readonly dataSelectionService: DataSelectionService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {}

    ngOnInit(): void {
        this.layerCollectionService.getLayerCollectionItems(this.collection.providerId, this.collection.collectionId).subscribe((items) => {
            const collections = [];
            for (const item of items) {
                if (item.type === 'collection') {
                    collections.push(item as LayerCollectionDict);
                }
            }
            this.datasets$.next(collections);

            this.selectedLayers$.next(new Array(collections.length).fill(undefined));
        });
    }

    layerSelected(i: number, id: ProviderLayerIdDict | undefined): void {
        const selected = this.selectedLayers$.getValue();
        selected[i] = id;
        this.selectedLayers$.next(selected);
    }

    loadData(i: number): void {
        const id = this.selectedLayers$.getValue()[i];
        if (!id) {
            return;
        }

        this.layerCollectionService
            .getLayer(id.providerId, id.layerId)
            .pipe(
                mergeMap((layer) => combineLatest([of(layer), this.projectService.registerWorkflow(layer.workflow)])),
                mergeMap(([layer, workflowId]) => {
                    if (!layer.symbology) {
                        throw new Error('Layer has no symbology');
                    }

                    if (!layer.properties) {
                        throw new Error('Layer has no properties');
                    }

                    if (!('timeSteps' in layer.properties)) {
                        throw new Error('Layer has no timeSteps');
                    }

                    if (!('dataRange' in layer.properties)) {
                        throw new Error('Layer has no dataRange');
                    }

                    const timeSteps: Array<Time> = JSON.parse(layer.properties['timeSteps']).map((t: number) => new Time(t));

                    const range: [number, number] = JSON.parse(layer.properties['dataRange']);
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
