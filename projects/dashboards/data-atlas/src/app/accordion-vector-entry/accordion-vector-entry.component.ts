import {Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef} from '@angular/core';
import {mergeMap, BehaviorSubject, of, forkJoin, from} from 'rxjs';
import {LayerCollectionLayerDict, ProjectService, ProviderLayerCollectionIdDict, UUID, VectorResultDescriptorDict} from '@geoengine/core';
import {DataSelectionService} from '../data-selection.service';
import moment from 'moment';
import {Layer as LayerDict} from '@geoengine/openapi-client';
import {
    LayersService,
    RandomColorService,
    Time,
    VectorLayer,
    VectorSymbology,
    VectorSymbologyDict,
    createVectorSymbology,
    AsyncValueDefault,
} from '@geoengine/common';
import {MatCard, MatCardHeader, MatCardAvatar, MatCardTitle, MatCardSubtitle, MatCardContent} from '@angular/material/card';
import {MatIcon} from '@angular/material/icon';
import {MatButton} from '@angular/material/button';
import {AsyncPipe} from '@angular/common';

@Component({
    selector: 'geoengine-accordion-vector-entry',
    templateUrl: './accordion-vector-entry.component.html',
    styleUrls: ['./accordion-vector-entry.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        MatCard,
        MatCardHeader,
        MatIcon,
        MatCardAvatar,
        MatCardTitle,
        MatCardSubtitle,
        MatCardContent,
        MatButton,
        AsyncPipe,
        AsyncValueDefault,
    ],
})
export class AccordionVectorEntryComponent implements OnInit {
    @Input() collection!: ProviderLayerCollectionIdDict;
    @Input() icon = 'class';

    readonly layers$ = new BehaviorSubject<Array<LayerCollectionLayerDict>>([]);

    constructor(
        private readonly layersService: LayersService,
        readonly projectService: ProjectService,
        readonly dataSelectionService: DataSelectionService,
        private readonly changeDetectorRef: ChangeDetectorRef,
        private readonly randomColorService: RandomColorService,
    ) {}

    ngOnInit(): void {
        from(this.layersService.getLayerCollectionItems(this.collection.providerId, this.collection.collectionId)).subscribe((c) => {
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

        forkJoin({
            layer: this.layersService.getLayer(id.providerId, id.layerId),
            workflowId: this.layersService.registerAndGetLayerWorkflowId(id.providerId, id.layerId),
        })
            .pipe(
                mergeMap(({layer, workflowId}: {layer: LayerDict; workflowId: UUID}) =>
                    forkJoin({
                        layer: of(layer),
                        workflowId: of(workflowId),
                        resultDescriptorDict: this.projectService.getWorkflowMetaData(workflowId),
                    }),
                ),
                mergeMap(({layer, workflowId, resultDescriptorDict}) => {
                    const keys = Object.keys(resultDescriptorDict);
                    if (!keys.includes('columns')) {
                        return of(); // is not a vector layer
                    }

                    if (!layer.metadata) {
                        throw new Error('Layer has no metadata');
                    }

                    if (!('timeSteps' in layer.metadata)) {
                        throw new Error('Layer has no timeSteps');
                    }

                    const timeSteps: Array<Time> = JSON.parse(layer.metadata['timeSteps']).map((t: string | number) => {
                        if (typeof t === 'string') {
                            // we try to parse it as an ISO timestamp string
                            return new Time(moment(t));
                        } else {
                            // we try to parse it as a unix timestamp
                            return new Time(t);
                        }
                    });

                    const vectorResultDescriptorDict = resultDescriptorDict as VectorResultDescriptorDict;
                    let symbology: VectorSymbology;

                    if (layer.symbology) {
                        symbology = VectorSymbology.fromVectorSymbologyDict(layer.symbology as VectorSymbologyDict);
                    } else {
                        symbology = createVectorSymbology(
                            vectorResultDescriptorDict.dataType,
                            this.randomColorService.getRandomColorRgba(),
                        );
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
}
