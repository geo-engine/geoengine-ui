import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {Symbology, SymbologyType} from '../symbology.model';
import {Layer} from '../../layer.model';
import {ProjectService} from '../../../project/project.service';

@Component({
    selector: 'wave-symbology-editor',
    templateUrl: 'symbology-editor.component.html',
    styleUrls: ['symbology-editor.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})

export class SymbologyEditorComponent {

    // make visible in template
    // tslint:disable:variable-name
    ST = SymbologyType;
    // tslint:enable

    @Input()
    showLayerSelect = false;

    @Input()
    layer = undefined;

    constructor(
        private projectService: ProjectService
    ) {}

    get validLayer(): boolean {
        return !!this.layer
    }

    update_symbology(layer: Layer<Symbology>, symbology: Symbology) {
        console.log('update_symbology', symbology);
        this.projectService.changeLayer(layer, {symbology: symbology});
    }

}
