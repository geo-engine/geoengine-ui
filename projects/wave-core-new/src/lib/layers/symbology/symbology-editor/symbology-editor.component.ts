import {ChangeDetectionStrategy, Component, Input, OnDestroy} from '@angular/core';
import {AbstractSymbology, SymbologyType} from '../symbology.model';
import {Layer, RasterLayer, VectorLayer} from '../../layer.model';
import {ProjectService} from '../../../project/project.service';
import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {Config} from '../../../config.service';

/**
 * The symbology editor component takes a Layer as input and provides multiple ways to change its symbology.
 * Changes are sent to the ProjectService.
 */
@Component({
    selector: 'wave-symbology-editor',
    templateUrl: 'symbology-editor.component.html',
    styleUrls: ['symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SymbologyEditorComponent implements OnDestroy {
    // make visible in template
    /* eslint-disable @typescript-eslint/naming-convention, no-underscore-dangle, id-blacklist, id-match */
    readonly ST = SymbologyType;
    /* eslint-enable */

    /**
     * input to hide/show a layer selection
     */
    @Input() showLayerSelect = false;

    /**
     * input to submit the layer with the symbology to edit
     */
    @Input() layer: Layer = undefined;

    // The list with all valid layers, required for the layer selection.
    validLayers: Array<Layer> = undefined;
    private subscriptions: Array<Subscription> = [];
    private layerChanges = new Subject<[Layer, AbstractSymbology]>();

    constructor(private config: Config, public projectService: ProjectService) {
        // This subscription updates the valid layer list.
        const layerStreamSubscription = this.projectService
            .getLayerStream()
            .subscribe((projectLayers) => (this.validLayers = projectLayers));
        this.subscriptions.push(layerStreamSubscription);
        // This subscription sends layer / symbology changes to the project service.
        const layerChangesSubscription = this.layerChanges.pipe(debounceTime(config.DELAYS.DEBOUNCE)).subscribe(([layer, symbology]) => {
            // TODO: call change layer
            // this.projectService.changeLayer(layer, {symbology})
        });
        this.subscriptions.push(layerChangesSubscription);
    }

    /**
     * Indicates if the current layer is a valid layer
     */
    get isValidLayer(): boolean {
        return !!this.layer && !!this.layer.symbology && !!this.validLayers.find((x) => x === this.layer);
    }

    /**
     * Submit a layer and the desired symbology to update the layer accordingly.
     */
    updateSymbology(layer: Layer, symbology: AbstractSymbology) {
        this.layerChanges.next([layer, symbology]);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
    }

    asVectorLayer(layer: Layer): VectorLayer {
        return layer as VectorLayer;
    }

    asRasterLayer(layer: Layer): RasterLayer {
        return layer as RasterLayer;
    }
}
