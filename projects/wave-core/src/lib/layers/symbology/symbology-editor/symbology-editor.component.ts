import {ChangeDetectionStrategy, Component, Input, OnDestroy} from '@angular/core';
import {AbstractSymbology, SymbologyType} from '../symbology.model';
import {Layer} from '../../layer.model';
import {ProjectService} from '../../../project/project.service';
import {ReplaySubject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {Config} from '../../../config.service';

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
    private layerChanges = new ReplaySubject<[Layer<AbstractSymbology>, AbstractSymbology]>(1);

    constructor(
        private config: Config,
        public projectService: ProjectService
    ) {
        const sub1 = this.projectService.getLayerStream().subscribe(projectLayers => this.validLayers = projectLayers);
        this.subscriptions.push(sub1);
        const sub2 = this.layerChanges.pipe(debounceTime(config.DELAYS.DEBOUNCE)).subscribe(
            ([layer, symbology]) => this.projectService.changeLayer(layer, {symbology})
        );
        this.subscriptions.push(sub2);
    }

    get isValidLayer(): boolean {
        return !!this.layer && !!this.layer.symbology && !!this.validLayers.find(x => x === this.layer);
    }

    update_symbology(layer: Layer<AbstractSymbology>, symbology: AbstractSymbology) {
        this.layerChanges.next([layer, symbology]);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(x => x.unsubscribe());
    }
}
