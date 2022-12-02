import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import {mergeMap} from 'rxjs';
import {
    LayerCollectionLayerDict,
    ProviderLayerIdDict,
    RasterResultDescriptorDict,
    ResultDescriptorDict,
    VectorResultDescriptorDict,
} from '../../backend/backend.model';
import {BackendService} from '../../backend/backend.service';
import {UserService} from '../../users/user.service';
import {LayerCollectionService} from '../layer-collection.service';

@Component({
    selector: 'wave-layer-collection-layer',
    templateUrl: './layer-collection-layer.component.html',
    styleUrls: ['./layer-collection-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionLayerComponent implements OnInit, OnChanges {
    @Input() layer: LayerCollectionLayerDict | undefined = undefined;
    @Output() addClick: EventEmitter<ProviderLayerIdDict> = new EventEmitter();
    @Output() isExpanded: EventEmitter<boolean> = new EventEmitter();

    expanded = false;

    protected resultDesc: ResultDescriptorDict | RasterResultDescriptorDict | VectorResultDescriptorDict | undefined = undefined;

    protected loading = false;

    constructor(private layerService: LayerCollectionService, private changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            this.changeDetectorRef.markForCheck();
        }
    }

    ngOnInit(): void {}

    toggleExpand(): void {
        if (this.layer) {
            this.expanded = !this.expanded;
            if (!this.resultDesc) {
                this.loading = true;
                this.layerService
                    .registeredWorkflowForLayer(this.layer.id.providerId, this.layer.id.layerId)
                    .pipe(mergeMap((workflowId) => this.layerService.getWorkflowMetadata(workflowId)))
                    .subscribe((resultDescriptor) => {
                        this.resultDesc = resultDescriptor;
                        this.loading = false;
                        this.changeDetectorRef.markForCheck();
                    });
            } else {
                this.changeDetectorRef.markForCheck();
            }
        }

        this.isExpanded.emit(this.expanded);
    }

    onAdd(): void {
        if (this.layer) {
            this.addClick.emit(this.layer.id);
        }
    }

    get rasterResultDescriptor(): RasterResultDescriptorDict | undefined {
        const rd = this.resultDesc as RasterResultDescriptorDict;
        if (rd && rd.type === 'raster') {
            return rd;
        }
        return undefined;
    }

    get vectorResultDescriptor(): VectorResultDescriptorDict | undefined {
        const rd = this.resultDesc as VectorResultDescriptorDict;
        if (rd && rd.type === 'vector') {
            return rd;
        }
        return undefined;
    }
}
