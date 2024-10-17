import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {LayerCollectionListing, ProviderLayerId} from '@geoengine/openapi-client';
import {ProjectService} from '../project/project.service';

@Component({
    selector: 'geoengine-collection-layer-selection',
    templateUrl: './layer-collection-selection.component.html',
    styleUrls: ['./layer-collection-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayerCollectionSelectionComponent {
    @Input({required: true}) rootCollectionItem!: LayerCollectionListing;

    constructor(private readonly projectService: ProjectService) {}

    selectLayer(id: ProviderLayerId): void {
        this.projectService.addLayerbyId(id);
    }
}
