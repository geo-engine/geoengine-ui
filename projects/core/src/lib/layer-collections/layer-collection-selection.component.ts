import {Component, ChangeDetectionStrategy, Input} from '@angular/core';
import {LayerListing, ProviderLayerCollectionId} from '@geoengine/openapi-client';
import {ProjectService} from '../project/project.service';
import {SidenavHeaderComponent} from '../sidenav/sidenav-header/sidenav-header.component';
import {CommonModule} from '@geoengine/common';

@Component({
    selector: 'geoengine-collection-layer-selection',
    templateUrl: './layer-collection-selection.component.html',
    styleUrls: ['./layer-collection-selection.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [SidenavHeaderComponent, CommonModule],
})
export class LayerCollectionSelectionComponent {
    @Input({required: true}) collectionId!: ProviderLayerCollectionId;
    @Input({required: false}) collectionName = 'Layer Collection';

    constructor(private readonly projectService: ProjectService) {}

    selectLayer(layer: LayerListing): void {
        this.projectService.addLayerbyId(layer.id);
    }
}
