import {Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef} from '@angular/core';
import {mergeMap, BehaviorSubject, combineLatest, of} from 'rxjs';
import {
    ClusteredPointSymbology,
    colorToDict,
    LayerCollectionLayerDict,
    LayerCollectionService,
    LayerDict,
    LineSymbology,
    PointSymbology,
    PolygonSymbology,
    ProjectService,
    ProviderLayerCollectionIdDict,
    RandomColorService,
    Time,
    UUID,
    VectorLayer,
    VectorResultDescriptorDict,
    VectorSymbology,
    VectorSymbologyDict,
} from '@geoengine/core';
import {DataSelectionService} from '../data-selection.service';
import moment from 'moment';

@Component({
    selector: 'geoengine-accordion-vector-entry',
    templateUrl: './accordion-vector-entry.component.html',
    styleUrls: ['./accordion-vector-entry.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccordionVectorEntryComponent implements OnInit {
    @Input() collection!: ProviderLayerCollectionIdDict;
    @Input() icon = 'class';

    readonly layers$ = new BehaviorSubject<Array<LayerCollectionLayerDict>>([]);

    constructor(
        private readonly layerCollectionService: LayerCollectionService,
        readonly projectService: ProjectService,
        readonly dataSelectionService: DataSelectionService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly randomColorService: RandomColorService,
    ) {}

    ngOnInit(): void {
        this.layerCollectionService.getLayerCollectionItems(this.collection.providerId, this.collection.collectionId).subscribe((c) => {
            const layers = [];
            for (const item of c.items) {
                if (item.type !== 'layer') {
                    continue;
                }

                const layer = item as LayerCollectionLayerDict;
                layers.push(layer);
            }

            this.layers$.next(layers);
        });
    }

    loadData(layerListing: LayerCollectionLayerDict): void {
        const id = layerListing.id;

        this.layerCollectionService
            .getLayer(id.providerId, id.layerId)
            .pipe(
                mergeMap((layer) => combineLatest([of(layer), this.projectService.registerWorkflow(layer.workflow)])),
                mergeMap(([layer, workflowId]: [LayerDict, UUID]) =>
                    combineLatest([of(layer), of(workflowId), this.projectService.getWorkflowMetaData(workflowId)]),
                ),
                mergeMap(([layer, workflowId, resultDescriptorDict]) => {
                    const keys = Object.keys(resultDescriptorDict);
                    if (!keys.includes('columns')) {
                        return of(); // is not a vector layer
                    }

                    // console.log(layer.metadata, layerListing.properties);

                    if (!('timeSteps' in layer.metadata)) {
                        // TODO: get time
                        // throw new Error('Layer has no timeSteps');
                    }

                    // const timeSteps: Array<Time> = JSON.parse(layer.metadata['timeSteps']).map((t: number) => new Time(t));

                    // TODO: read from metadata
                    const timeSteps: Array<Time> = [new Time(moment.utc())];

                    const vectorResultDescriptorDict = resultDescriptorDict as VectorResultDescriptorDict;
                    let symbology: VectorSymbology;

                    if (layer.symbology) {
                        symbology = VectorSymbology.fromVectorSymbologyDict(layer.symbology as VectorSymbologyDict);
                    } else {
                        symbology = this.createVectorSymbology(vectorResultDescriptorDict.dataType);
                    }

                    const vectorLayer = new VectorLayer({
                        name: 'EBV',
                        workflowId,
                        isVisible: true,
                        isLegendVisible: false,
                        symbology,
                    });

                    return this.dataSelectionService.setVectorLayer(vectorLayer, timeSteps);
                }),
            )
            .subscribe(() => this.changeDetectorRef.markForCheck());
    }

    private createVectorSymbology(dataType: 'Data' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon'): VectorSymbology {
        switch (dataType) {
            case 'Data':
                // TODO: cope with that
                throw Error('we cannot add data layers here, yet');
            case 'MultiPoint':
                return ClusteredPointSymbology.fromPointSymbologyDict({
                    type: 'point',
                    radius: {type: 'static', value: PointSymbology.DEFAULT_POINT_RADIUS},
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                    fillColor: {type: 'static', color: colorToDict(this.randomColorService.getRandomColorRgba())},
                });
            case 'MultiLineString':
                return LineSymbology.fromLineSymbologyDict({
                    type: 'line',
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                });
            case 'MultiPolygon':
                return PolygonSymbology.fromPolygonSymbologyDict({
                    type: 'polygon',
                    stroke: {
                        width: {type: 'static', value: 1},
                        color: {type: 'static', color: [0, 0, 0, 255]},
                    },
                    fillColor: {type: 'static', color: colorToDict(this.randomColorService.getRandomColorRgba())},
                });
        }
    }
}
