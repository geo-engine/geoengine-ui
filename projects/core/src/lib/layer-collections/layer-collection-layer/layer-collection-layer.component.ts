import {ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {LayerCollectionLayerDict, ResultDescriptorDict} from '../../backend/backend.model';
import {BackendService} from '../../backend/backend.service';
import {UserService} from '../../users/user.service';

@Component({
    selector: 'wave-layer-collection-layer',
    templateUrl: './layer-collection-layer.component.html',
    styleUrls: ['./layer-collection-layer.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionLayerComponent implements OnInit, OnChanges {
    @Input() layer: LayerCollectionLayerDict | undefined = undefined;

    protected resultDescriptor: ResultDescriptorDict | undefined = undefined;

    constructor(private backendService: BackendService, private userService: UserService, private changeDetectorRef: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.layer) {
            console.log('LayerCollectionLayerComponent.ngOnChanges', changes.layer);
            this.changeDetectorRef.markForCheck();
        }
    }

    ngOnInit(): void {}
}
