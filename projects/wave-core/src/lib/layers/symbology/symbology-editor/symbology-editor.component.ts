import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {AbstractSymbology, SymbologyType} from '../symbology.model';
import {Layer} from '../../layer.model';
import {ProjectService} from '../../../project/project.service';
import {Subscription} from 'rxjs';

@Component({
    selector: 'wave-symbology-editor',
    templateUrl: 'symbology-editor.component.html',
    styleUrls: ['symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SymbologyEditorComponent implements OnDestroy {

    // make visible in template
    // tslint:disable:variable-name
    readonly ST = SymbologyType;
    // tslint:enable

    @Input() showLayerSelect = false;

    @Input() layer: Layer<AbstractSymbology> = undefined;
    validLayers: Array<Layer<AbstractSymbology>> = undefined;
    private subscriptions: Array<Subscription> = [];

    constructor(
        public projectService: ProjectService
    ) {
        const sub = this.projectService.getLayerStream().subscribe(projectLayers => this.validLayers = projectLayers);
        this.subscriptions.push(sub);
    }

    get isValidLayer(): boolean {
        return !!this.layer && !!this.layer.symbology && !!this.validLayers.find(x => x === this.layer);
    }

    update_symbology(layer: Layer<AbstractSymbology>, symbology: AbstractSymbology) {
        this.projectService.changeLayer(layer, {symbology: symbology});
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(x => x.unsubscribe());
    }
}
